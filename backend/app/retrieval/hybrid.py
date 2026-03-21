"""Hybrid retrieval combining BM25 lexical and Qdrant semantic search with RRF fusion."""

import logging
from collections import defaultdict

from rank_bm25 import BM25Okapi
from qdrant_client import AsyncQdrantClient

from app.ingestion.embedder import embed_single
from app.retrieval.types import RetrievedChunk, RetrievalMethod

logger = logging.getLogger(__name__)


def rrf_fuse(
    semantic_results: dict[tuple[str, int], float],
    lexical_results: dict[tuple[str, int], float],
    k: int = 60,
) -> list[tuple[tuple[str, int], float]]:
    """Reciprocal Rank Fusion (RRF) algorithm.

    Args:
        semantic_results: {(parent_doc_id, chunk_idx): score} from semantic search
        lexical_results: {(parent_doc_id, chunk_idx): score} from BM25 search
        k: RRF parameter (typical range 50-60)

    Returns:
        List of ((parent_doc_id, chunk_idx), fused_score) sorted by score desc.
    """
    all_keys = set(semantic_results.keys()) | set(lexical_results.keys())

    # Sort by score to get ranks
    semantic_ranked = sorted(semantic_results.items(), key=lambda x: x[1], reverse=True)
    lexical_ranked = sorted(lexical_results.items(), key=lambda x: x[1], reverse=True)

    # Create rank lookup
    semantic_rank_map = {doc: rank + 1 for rank, (doc, _) in enumerate(semantic_ranked)}
    lexical_rank_map = {doc: rank + 1 for rank, (doc, _) in enumerate(lexical_ranked)}

    # Compute RRF scores
    fused_scores: dict[tuple[str, int], float] = {}
    for key in all_keys:
        score = 0.0
        if key in semantic_rank_map:
            score += 1 / (k + semantic_rank_map[key])
        if key in lexical_rank_map:
            score += 1 / (k + lexical_rank_map[key])
        fused_scores[key] = score

    # Sort by fused score desc
    return sorted(fused_scores.items(), key=lambda x: x[1], reverse=True)


class HybridRetriever:
    """Combine Qdrant semantic search with BM25 lexical search."""

    def __init__(
        self,
        qdrant_client: AsyncQdrantClient,
        collection_name: str,
        corpus_chunks: list[str],
        corpus_chunk_payloads: list[dict],
        top_k: int = 20,
    ):
        """Initialize retriever with BM25 index built in-memory.

        Args:
            qdrant_client: Async Qdrant client
            collection_name: Qdrant collection name
            corpus_chunks: List of all chunk texts (for BM25 index)
            corpus_chunk_payloads: List of corresponding payloads
            top_k: Number of results to return per search method
        """
        self.qdrant_client = qdrant_client
        self.collection_name = collection_name
        self.top_k = top_k

        # Build BM25 index with whitespace tokenization
        tokenized = [chunk.lower().split() for chunk in corpus_chunks]
        self.bm25 = BM25Okapi(tokenized)
        self.chunk_texts = corpus_chunks
        self.payloads = corpus_chunk_payloads

        logger.info(f"Built BM25 index for {len(corpus_chunks)} chunks in {collection_name}")

    async def retrieve(
        self,
        query: str,
        concept_id: str | None = None,
        top_k: int | None = None,
    ) -> list[RetrievedChunk]:
        """Retrieve chunks via semantic + lexical, fuse with RRF.

        Args:
            query: Search query
            concept_id: Optional concept ID filter
            top_k: Number of results (use self.top_k if None)

        Returns:
            List of RetrievedChunk sorted by fused RRF score desc.
        """
        if top_k is None:
            top_k = self.top_k

        # 1. Semantic search via Qdrant
        query_embedding = await embed_single(query)

        # Use query_points (the correct method in qdrant-client 1.17.1+)
        search_result = await self.qdrant_client.query_points(
            collection_name=self.collection_name,
            query=query_embedding,
            limit=top_k,
            with_payload=True,
        )
        semantic_hits = search_result.points if search_result else []

        semantic_results: dict[tuple[str, int], float] = {}
        semantic_payloads = {}
        for hit in semantic_hits:
            payload = hit.payload
            key = (payload["parent_doc_id"], payload["chunk_index"])
            semantic_results[key] = hit.score
            semantic_payloads[key] = payload

        logger.info(f"Semantic search found {len(semantic_results)} chunks for query")

        # 2. BM25 lexical search
        query_tokens = query.lower().split()
        bm25_scores = self.bm25.get_scores(query_tokens)

        lexical_results: dict[tuple[str, int], float] = {}
        lexical_payloads = {}
        for idx, score in enumerate(bm25_scores):
            if score > 0:
                payload = self.payloads[idx]
                key = (payload["parent_doc_id"], payload["chunk_index"])
                lexical_results[key] = score
                lexical_payloads[key] = payload

        # Keep top_k by score
        lexical_results = dict(
            sorted(lexical_results.items(), key=lambda x: x[1], reverse=True)[:top_k]
        )
        logger.info(f"BM25 search found {len(lexical_results)} chunks for query")

        # 3. RRF fusion
        fused = rrf_fuse(semantic_results, lexical_results, k=60)

        # 4. Convert to RetrievedChunk objects
        results = []
        for (parent_doc_id, chunk_idx), rrf_score in fused[:top_k]:
            # Prefer semantic payload, fall back to lexical
            payload = semantic_payloads.get((parent_doc_id, chunk_idx)) or lexical_payloads.get(
                (parent_doc_id, chunk_idx)
            )

            if payload is None:
                logger.warning(f"Could not find payload for {parent_doc_id}:{chunk_idx}")
                continue

            results.append(
                RetrievedChunk(
                    chunk_text=payload.get("chunk_text", ""),
                    concept_id=payload.get("concept_id", ""),
                    parent_doc_id=parent_doc_id,
                    source_page=payload.get("source_page"),
                    chunk_index=chunk_idx,
                    score=rrf_score,
                    retrieval_method=RetrievalMethod.FUSED,
                )
            )

        return results
