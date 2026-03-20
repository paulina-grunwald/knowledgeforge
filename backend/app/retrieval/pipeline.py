"""Retrieval pipeline orchestrator."""

import json
import logging
import time
from uuid import UUID

from app.db.redis_client import get_redis
from app.retrieval.hybrid import HybridRetriever, rrf_fuse
from app.retrieval.multi_query import expand_query
from app.retrieval.parent_doc import fetch_parent_sections
from app.retrieval.reranker import CohereReranker
from app.retrieval.types import RetrievalResult

logger = logging.getLogger(__name__)


class RetrievalPipeline:
    """Orchestrate hybrid retrieval → multi-query → reranking → parent fetch."""

    def __init__(
        self,
        hybrid_retriever: HybridRetriever,
        reranker: CohereReranker | None,
    ):
        """Initialize pipeline.

        Args:
            hybrid_retriever: HybridRetriever instance
            reranker: CohereReranker instance (optional)
        """
        self.hybrid = hybrid_retriever
        self.reranker = reranker

    async def retrieve(
        self,
        concept_name: str,
        concept_id: str | None = None,
        top_n: int = 5,
    ) -> RetrievalResult:
        """Full retrieval pipeline with caching.

        Steps:
          1. Check Redis cache
          2. Expand query to 3 variations
          3. Retrieve for each query (original + 3 expansions) via hybrid retriever
          4. Union and re-fuse all chunks with RRF
          5. Rerank top 20 unified chunks with Cohere
          6. Fetch parent sections for high-scoring chunks
          7. Cache result and return

        Args:
            concept_name: Concept name to retrieve
            concept_id: Optional concept ID filter
            top_n: Number of final results (default 5)

        Returns:
            RetrievalResult with chunks, parent sections, expansions, and latency.
        """
        start = time.time()
        redis = await get_redis()

        cache_key = f"retrieval:{concept_id}:{hash(concept_name)}"
        try:
            cached = await redis.get(cache_key)
            if cached:
                result = RetrievalResult(**json.loads(cached))
                logger.info(f"Cache hit for concept '{concept_name}' ({result.latency_ms}ms)")
                return result
        except Exception as e:
            logger.warning(f"Redis cache read failed: {e}")

        try:
            expansions = await expand_query(concept_name)
            logger.info(f"Expanded query '{concept_name}' to {len(expansions)} variations")
        except Exception as e:
            logger.warning(f"Query expansion failed: {e}; using only original query")
            expansions = []

        queries = [concept_name] + expansions

        all_results = []
        for i, q in enumerate(queries):
            try:
                chunks = await self.hybrid.retrieve(q, concept_id, top_k=20)
                all_results.append(chunks)
                logger.info(f"Query {i + 1}/{len(queries)}: '{q}' returned {len(chunks)} chunks")
            except Exception as e:
                logger.warning(f"Retrieval failed for query '{q}': {e}")
                continue

        if not all_results:
            logger.warning(f"All retrieval queries failed for concept '{concept_name}'")
            return RetrievalResult(chunks=[], parent_sections=[], query_expansions=expansions, latency_ms=0)

        # Union and re-fuse all chunks with RRF
        # Treat each query result set as a "retrieval method" for RRF
        unified_chunks = {}  # {(parent_doc_id, chunk_idx): [scores from each query]}

        for result_set in all_results:
            for chunk in result_set:
                key = (chunk.parent_doc_id, chunk.chunk_index)
                if key not in unified_chunks:
                    unified_chunks[key] = []
                unified_chunks[key].append(chunk.score)

        # Compute mean score for chunks that appeared in multiple result sets
        re_fused = {}
        for key, scores in unified_chunks.items():
            re_fused[key] = sum(scores) / len(scores)

        # Sort by score
        re_fused_sorted = sorted(re_fused.items(), key=lambda x: x[1], reverse=True)
        logger.info(
            f"Re-fused {len(re_fused)} unique chunks from {len(all_results)} result sets"
        )

        # 5. Rerank top 20 with Cohere
        top_20_chunks = []
        chunk_map = {
            (chunk.parent_doc_id, chunk.chunk_index): chunk
            for result_set in all_results
            for chunk in result_set
        }

        for (parent_id, chunk_idx), score in re_fused_sorted[:20]:
            chunk = chunk_map.get((parent_id, chunk_idx))
            if chunk:
                chunk.score = score
                top_20_chunks.append(chunk)

        try:
            if self.reranker:
                top_reranked = await self.reranker.rerank(concept_name, top_20_chunks, top_n=top_n)
            else:
                # No reranker available, use top-n from fused results
                logger.info("No reranker available; using top-n from RRF fusion")
                top_reranked = top_20_chunks[:top_n]
        except Exception as e:
            logger.warning(f"Reranking failed: {e}; using top {top_n} unfused chunks")
            top_reranked = top_20_chunks[:top_n]

        # 6. Fetch parent sections
        try:
            parent_sections = await fetch_parent_sections(
                top_reranked,
                self.hybrid.qdrant_client,
                self.hybrid.collection_name,
                score_threshold=0.85,
            )
        except Exception as e:
            logger.warning(f"Parent section fetch failed: {e}")
            parent_sections = []

        # 7. Build result
        latency_ms = int((time.time() - start) * 1000)
        result = RetrievalResult(
            chunks=top_reranked,
            parent_sections=parent_sections,
            query_expansions=expansions,
            latency_ms=latency_ms,
        )

        # Cache result for 1 hour
        try:
            # Convert chunks to dicts for JSON serialization
            chunks_data = [
                {
                    "chunk_text": c.chunk_text,
                    "concept_id": c.concept_id,
                    "parent_doc_id": c.parent_doc_id,
                    "source_page": c.source_page,
                    "chunk_index": c.chunk_index,
                    "score": c.score,
                    "retrieval_method": c.retrieval_method.value,
                }
                for c in result.chunks
            ]
            cache_data = {
                "chunks": chunks_data,
                "parent_sections": result.parent_sections,
                "query_expansions": result.query_expansions,
                "latency_ms": result.latency_ms,
            }
            await redis.setex(cache_key, 3600, json.dumps(cache_data))
            logger.info(f"Cached retrieval result for '{concept_name}'")
        except Exception as e:
            logger.warning(f"Redis cache write failed: {e}")

        logger.info(
            f"Retrieval complete for '{concept_name}': "
            f"{len(result.chunks)} chunks, {len(result.parent_sections)} sections, "
            f"{latency_ms}ms"
        )
        return result
