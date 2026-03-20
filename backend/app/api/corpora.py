import logging
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from qdrant_client import AsyncQdrantClient
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas.corpora import (
    AddDocumentsRequest,
    AddDocumentsResponse,
    ConceptItem,
    ConceptsResponse,
    CorpusDocumentItem,
    CorpusListItem,
    CorpusListResponse,
    CorpusStatusResponse,
    CreateCorpusRequest,
    CreateCorpusResponse,
)
from app.config import settings
from app.db.models import Concept, Corpus, CorpusStatus, Document, KnowledgeState, corpus_documents
from app.db.session import get_db
from app.db.session import async_session_factory
from app.ingestion.loaders import load_document
from app.ingestion.pipeline import ingest_corpus
from app.ingestion.storage import FileStorage

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/corpora", tags=["corpora"])


def get_storage() -> FileStorage:
    return FileStorage(settings.upload_dir)


def get_qdrant() -> AsyncQdrantClient:
    return AsyncQdrantClient(url=settings.qdrant_url)


def _get_collection_name(user_id: str, corpus_id: str) -> str:
    """Format Qdrant collection name."""
    return f"{user_id}_{corpus_id}"


async def _run_ingestion(
    corpus_id: UUID,
    user_id: UUID,
    document_ids: list[UUID],
    storage: FileStorage,
) -> None:
    """Load documents and run ingestion pipeline."""
    async with async_session_factory() as db:
        qdrant = AsyncQdrantClient(url=settings.qdrant_url)

        doc_pages_list = []

        for doc_id in document_ids:
            doc = await db.get(Document, doc_id)
            if doc is None:
                logger.error("Document %s not found during ingestion", doc_id)
                continue

            file_bytes = await storage.load(str(user_id), str(doc_id), doc.filename)
            doc_pages = await load_document(
                document_id=str(doc_id),
                filename=doc.filename,
                source_type=doc.source_type,
                file_bytes=file_bytes,
            )
            doc_pages_list.append(doc_pages)

        await ingest_corpus(
            corpus_id=corpus_id,
            user_id=user_id,
            document_pages=doc_pages_list,
            db=db,
            qdrant=qdrant,
        )
        await db.commit()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post("", response_model=CreateCorpusResponse, status_code=201)
async def create_corpus(
    request: CreateCorpusRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    qdrant: AsyncQdrantClient = Depends(get_qdrant),
    storage: FileStorage = Depends(get_storage),
) -> CreateCorpusResponse:
    """Create a new corpus with the specified documents and trigger ingestion."""
    user_uuid = UUID(request.user_id)

    # Validate all documents exist and belong to user
    for doc_id in request.document_ids:
        stmt = select(Document).where(
            Document.id == UUID(doc_id),
            Document.user_id == user_uuid,
        )
        result = await db.execute(stmt)
        doc = result.scalar_one_or_none()
        if doc is None:
            raise HTTPException(
                status_code=404,
                detail=f"Document {doc_id} not found or does not belong to user",
            )

    # Create corpus
    corpus = Corpus(
        user_id=user_uuid,
        name=request.name,
        status=CorpusStatus.PENDING,
    )
    db.add(corpus)
    await db.flush()

    # Create association rows
    for doc_id in request.document_ids:
        await db.execute(
            corpus_documents.insert().values(
                corpus_id=corpus.id,
                document_id=UUID(doc_id),
            )
        )

    await db.commit()

    # Fire background ingestion
    background_tasks.add_task(
        _run_ingestion,
        corpus_id=corpus.id,
        user_id=user_uuid,
        document_ids=[UUID(doc_id) for doc_id in request.document_ids],
        storage=storage,
    )

    return CreateCorpusResponse(
        corpus_id=str(corpus.id),
        status=CorpusStatus.PENDING.value,
        message="Ingestion started",
        document_count=len(request.document_ids),
    )


@router.get("", response_model=CorpusListResponse)
async def list_corpora(
    user_id: str,
    db: AsyncSession = Depends(get_db),
) -> CorpusListResponse:
    """List all corpora owned by a user."""
    user_uuid = UUID(user_id)

    doc_count_subq = (
        select(func.count())
        .select_from(corpus_documents)
        .where(corpus_documents.c.corpus_id == Corpus.id)
        .correlate(Corpus)
        .scalar_subquery()
    )

    concept_count_subq = (
        select(func.count())
        .select_from(Concept)
        .where(Concept.corpus_id == Corpus.id)
        .correlate(Corpus)
        .scalar_subquery()
    )

    stmt = (
        select(
            Corpus,
            doc_count_subq.label("doc_count"),
            concept_count_subq.label("concept_count"),
        )
        .where(Corpus.user_id == user_uuid)
        .order_by(Corpus.created_at.desc())
    )
    result = await db.execute(stmt)
    rows = result.all()

    items = [
        CorpusListItem(
            corpus_id=str(corpus.id),
            name=corpus.name,
            status=corpus.status.value,
            document_count=doc_count or 0,
            chunk_count=corpus.chunk_count,
            concept_count=concept_count or 0,
            created_at=corpus.created_at,
            ingested_at=corpus.ingested_at,
        )
        for corpus, doc_count, concept_count in rows
    ]

    return CorpusListResponse(corpora=items, total=len(items))


@router.get("/{corpus_id}", response_model=CorpusStatusResponse)
async def get_corpus_status(
    corpus_id: str,
    db: AsyncSession = Depends(get_db),
) -> CorpusStatusResponse:
    """Get corpus status with document details. Polling endpoint."""
    corpus = await db.get(Corpus, UUID(corpus_id))
    if corpus is None:
        raise HTTPException(status_code=404, detail="Corpus not found")

    # Get documents
    stmt = (
        select(Document)
        .join(corpus_documents, Document.id == corpus_documents.c.document_id)
        .where(corpus_documents.c.corpus_id == corpus.id)
    )
    result = await db.execute(stmt)
    docs = result.scalars().all()

    # Get concept count
    concept_stmt = select(func.count()).select_from(Concept).where(
        Concept.corpus_id == corpus.id
    )
    concept_result = await db.execute(concept_stmt)
    concept_count = concept_result.scalar() or 0

    return CorpusStatusResponse(
        corpus_id=str(corpus.id),
        name=corpus.name,
        status=corpus.status.value,
        chunk_count=corpus.chunk_count,
        concept_count=concept_count,
        document_count=len(docs),
        documents=[
            CorpusDocumentItem(
                document_id=str(d.id),
                filename=d.filename,
                source_type=d.source_type.value,
            )
            for d in docs
        ],
        ingested_at=corpus.ingested_at,
        created_at=corpus.created_at,
    )


@router.get("/{corpus_id}/concepts", response_model=ConceptsResponse)
async def get_corpus_concepts(
    corpus_id: str,
    db: AsyncSession = Depends(get_db),
) -> ConceptsResponse:
    """Get all concepts in a corpus with prerequisite names resolved."""
    corpus = await db.get(Corpus, UUID(corpus_id))
    if corpus is None:
        raise HTTPException(status_code=404, detail="Corpus not found")

    stmt = select(Concept).where(Concept.corpus_id == corpus.id).order_by(Concept.name)
    result = await db.execute(stmt)
    concepts = result.scalars().all()

    # Build a map of concept IDs to names for prerequisite lookup
    concept_id_to_name = {c.id: c.name for c in concepts}

    return ConceptsResponse(
        corpus_id=corpus_id,
        concepts=[
            ConceptItem(
                concept_id=str(c.id),
                name=c.name,
                definition=c.definition,
                prerequisites=[
                    concept_id_to_name.get(p, str(p))
                    for p in (c.prerequisites or [])
                    if p in concept_id_to_name
                ],
            )
            for c in concepts
        ],
        total=len(concepts),
    )


@router.post("/{corpus_id}/documents", response_model=AddDocumentsResponse)
async def add_documents_to_corpus(
    corpus_id: str,
    request: AddDocumentsRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    qdrant: AsyncQdrantClient = Depends(get_qdrant),
    storage: FileStorage = Depends(get_storage),
) -> AddDocumentsResponse:
    """Add documents to an existing corpus and re-run ingestion."""
    corpus = await db.get(Corpus, UUID(corpus_id))
    if corpus is None:
        raise HTTPException(status_code=404, detail="Corpus not found")

    user_uuid = UUID(request.user_id)
    if corpus.user_id != user_uuid:
        raise HTTPException(status_code=403, detail="Corpus does not belong to user")

    # Validate documents exist and belong to user
    for doc_id in request.document_ids:
        stmt = select(Document).where(
            Document.id == UUID(doc_id),
            Document.user_id == user_uuid,
        )
        result = await db.execute(stmt)
        if result.scalar_one_or_none() is None:
            raise HTTPException(
                status_code=404,
                detail=f"Document {doc_id} not found or does not belong to user",
            )

    # Get existing document IDs to skip duplicates
    existing_stmt = select(corpus_documents.c.document_id).where(
        corpus_documents.c.corpus_id == corpus.id
    )
    existing_result = await db.execute(existing_stmt)
    existing_doc_ids = {str(row[0]) for row in existing_result.all()}

    new_doc_ids = [d for d in request.document_ids if d not in existing_doc_ids]
    if not new_doc_ids:
        raise HTTPException(
            status_code=409,
            detail="All documents are already in this study set",
        )

    # Add new document associations
    for doc_id in new_doc_ids:
        await db.execute(
            corpus_documents.insert().values(
                corpus_id=corpus.id,
                document_id=UUID(doc_id),
            )
        )

    # Clear old concepts and knowledge states for re-ingestion
    concept_ids_subq = select(Concept.id).where(Concept.corpus_id == corpus.id)
    await db.execute(
        delete(KnowledgeState).where(KnowledgeState.concept_id.in_(concept_ids_subq))
    )
    await db.execute(delete(Concept).where(Concept.corpus_id == corpus.id))

    corpus.status = CorpusStatus.PENDING
    corpus.chunk_count = 0
    corpus.ingested_at = None
    await db.commit()

    # Delete old Qdrant collection
    collection_name = _get_collection_name(request.user_id, corpus_id)
    try:
        await qdrant.delete_collection(collection_name)
    except Exception:
        logger.warning("Could not delete Qdrant collection: %s", collection_name)

    # Get ALL document IDs (old + new) for full re-ingestion
    all_doc_stmt = select(corpus_documents.c.document_id).where(
        corpus_documents.c.corpus_id == corpus.id
    )
    all_doc_result = await db.execute(all_doc_stmt)
    all_doc_ids = [row[0] for row in all_doc_result.all()]

    background_tasks.add_task(
        _run_ingestion,
        corpus_id=corpus.id,
        user_id=user_uuid,
        document_ids=all_doc_ids,
        storage=storage,
    )

    return AddDocumentsResponse(
        corpus_id=corpus_id,
        status=CorpusStatus.PENDING.value,
        message=f"Added {len(new_doc_ids)} document(s), re-ingesting",
        document_count=len(all_doc_ids),
    )


@router.delete("/{corpus_id}", status_code=204)
async def delete_corpus(
    corpus_id: str,
    db: AsyncSession = Depends(get_db),
    qdrant: AsyncQdrantClient = Depends(get_qdrant),
) -> None:
    """Delete a corpus, its concepts, knowledge states, and Qdrant collection."""
    corpus = await db.get(Corpus, UUID(corpus_id))
    if corpus is None:
        raise HTTPException(status_code=404, detail="Corpus not found")

    user_id = str(corpus.user_id)

    # Delete knowledge states for concepts in this corpus
    concept_ids_subq = select(Concept.id).where(Concept.corpus_id == corpus.id)
    await db.execute(
        delete(KnowledgeState).where(KnowledgeState.concept_id.in_(concept_ids_subq))
    )

    # Delete corpus (cascades to concepts + corpus_documents)
    await db.delete(corpus)
    await db.flush()

    # Try to delete Qdrant collection
    collection_name = _get_collection_name(user_id, corpus_id)
    try:
        await qdrant.delete_collection(collection_name)
        logger.info("Deleted Qdrant collection: %s", collection_name)
    except Exception:
        logger.warning("Could not delete Qdrant collection: %s", collection_name)
