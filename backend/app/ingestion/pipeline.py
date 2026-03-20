import logging
from datetime import UTC, datetime
from uuid import UUID, uuid4

import numpy as np
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import PointStruct
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Concept, Corpus, CorpusStatus, KnowledgeState, KnowledgeStateEnum
from app.db.qdrant_setup import ensure_collection
from app.ingestion.chunker import Chunk, chunk_pages
from app.ingestion.concept_extractor import extract_concepts, resolve_prerequisites
from app.ingestion.embedder import embed_chunks, embed_single
from app.ingestion.loaders import DocumentPages

logger = logging.getLogger(__name__)

DEDUP_THRESHOLD = 0.92


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    va = np.array(a)
    vb = np.array(b)
    dot = np.dot(va, vb)
    norm = np.linalg.norm(va) * np.linalg.norm(vb)
    if norm == 0:
        return 0.0
    return float(dot / norm)


async def ingest_corpus(
    corpus_id: UUID,
    user_id: UUID,
    document_pages: list[DocumentPages],
    db: AsyncSession,
    qdrant: AsyncQdrantClient,
) -> None:
    """Full ingestion pipeline. Called as a background task.

    Steps:
      1. Update corpus.status = "processing"
      2. Chunk all documents, tag chunks with document_id
      3. Embed all chunks
      4. Extract concepts from concatenated text (truncate to 80k chars)
      5. Embed concept definitions, insert into DB
      6. Resolve prerequisites
      7. Deduplicate concepts (cosine_similarity > 0.92)
      8. Create Qdrant collection, upsert chunks with payload
      9. Create KnowledgeState rows (all UNSEEN)
     10. Update corpus.status = "ready"
     11. On exception: corpus.status = "failed"
    """
    try:
        # 1. Set processing
        corpus = await db.get(Corpus, corpus_id)
        if corpus is None:
            raise ValueError(f"Corpus {corpus_id} not found")
        corpus.status = CorpusStatus.PROCESSING
        await db.commit()

        # 2. Chunk all documents
        all_chunks: list[Chunk] = []
        full_text_parts: list[str] = []

        for dp in document_pages:
            chunks = chunk_pages(
                dp.pages,
                dp.document_id,
                document_title=dp.filename,
                source_type=dp.source_type.value,
            )
            all_chunks.extend(chunks)
            full_text_parts.extend(dp.pages)

        full_text = "\n\n".join(full_text_parts)
        logger.info("Total chunks: %d from %d documents", len(all_chunks), len(document_pages))

        # 3. Embed all chunks
        chunk_vectors = await embed_chunks(all_chunks)

        # 4. Extract concepts
        extraction_result = await extract_concepts(full_text)
        extracted_concepts = extraction_result.concepts
        logger.info("Extracted %d raw concepts", len(extracted_concepts))

        # 5. Embed concept definitions, insert into DB
        db_concepts: list[Concept] = []
        concept_embeddings: list[list[float]] = []

        for ec in extracted_concepts:
            emb = await embed_single(ec.definition)
            concept_embeddings.append(emb)

            concept = Concept(
                id=uuid4(),
                corpus_id=corpus_id,
                name=ec.name,
                definition=ec.definition,
                embedding=emb,
            )
            db.add(concept)
            db_concepts.append(concept)

        await db.flush()

        # 6. Resolve prerequisites
        stored_concepts = [{"id": str(c.id), "name": c.name} for c in db_concepts]
        prereq_map = resolve_prerequisites(extracted_concepts, stored_concepts)

        for concept in db_concepts:
            if concept.name in prereq_map:
                concept.prerequisites = prereq_map[concept.name]

        await db.flush()

        # 7. Deduplicate concepts (cosine_similarity > 0.92)
        # TODO Phase 2: Use FAISS or Qdrant's search for O(n log n) performance instead of O(n²)
        to_remove: set[int] = set()
        for i in range(len(db_concepts)):
            if i in to_remove:
                continue
            for j in range(i + 1, len(db_concepts)):
                if j in to_remove:
                    continue
                sim = _cosine_similarity(concept_embeddings[i], concept_embeddings[j])
                if sim > DEDUP_THRESHOLD:
                    # Keep the one with longer definition
                    if len(db_concepts[i].definition) >= len(db_concepts[j].definition):
                        to_remove.add(j)
                    else:
                        to_remove.add(i)
                    logger.info(
                        "Deduplicating concepts: '%s' and '%s' (sim=%.3f)",
                        db_concepts[i].name,
                        db_concepts[j].name,
                        sim,
                    )

        for idx in sorted(to_remove, reverse=True):
            await db.delete(db_concepts[idx])
            db_concepts.pop(idx)
            concept_embeddings.pop(idx)

        await db.flush()
        logger.info("After dedup: %d concepts", len(db_concepts))

        # 8. Ensure Qdrant collection and upsert chunks
        collection_name = await ensure_collection(qdrant, str(user_id), str(corpus_id))

        points = []
        for chunk, vector in zip(all_chunks, chunk_vectors, strict=True):
            points.append(
                PointStruct(
                    id=str(uuid4()),
                    vector=vector,
                    payload={
                        "chunk_text": chunk.text,
                        "concept_id": "",
                        "parent_doc_id": chunk.parent_doc_id,
                        "document_id": chunk.document_id,
                        "document_title": chunk.document_title,
                        "source_type": chunk.source_type,
                        "source_page": chunk.source_page,
                        "chunk_index": chunk.chunk_index,
                    },
                )
            )

        # Upsert in batches of 100
        for i in range(0, len(points), 100):
            batch = points[i : i + 100]
            await qdrant.upsert(collection_name=collection_name, points=batch)

        logger.info("Upserted %d points to Qdrant collection %s", len(points), collection_name)

        # 9. Create KnowledgeState rows
        for concept in db_concepts:
            ks = KnowledgeState(
                id=uuid4(),
                user_id=user_id,
                concept_id=concept.id,
                state=KnowledgeStateEnum.UNSEEN,
            )
            db.add(ks)

        # 10. Update corpus status
        corpus.status = CorpusStatus.READY
        corpus.chunk_count = len(all_chunks)
        corpus.ingested_at = datetime.now(UTC)
        await db.commit()

        logger.info(
            "Ingestion complete for corpus %s: %d chunks, %d concepts",
            corpus_id,
            len(all_chunks),
            len(db_concepts),
        )

    except Exception:
        logger.exception("Ingestion failed for corpus %s", corpus_id)
        try:
            stmt = select(Corpus).where(Corpus.id == corpus_id)
            result = await db.execute(stmt)
            corpus = result.scalar_one_or_none()
            if corpus is not None:
                corpus.status = CorpusStatus.FAILED
                await db.commit()
        except Exception:
            logger.exception("Failed to update corpus status to FAILED")
        raise
