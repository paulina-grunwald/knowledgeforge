"""Cohere-based reranking with fallback."""

import asyncio
import logging

import cohere

from app.retrieval.types import RetrievedChunk

logger = logging.getLogger(__name__)


class CohereReranker:
    """Rerank chunks using Cohere API with graceful fallback."""

    def __init__(self, api_key: str, model: str = "rerank-english-v3.0"):
        """Initialize reranker.

        Args:
            api_key: Cohere API key
            model: Rerank model name
        """
        self.client = cohere.AsyncClient(api_key=api_key)
        self.model = model

    async def rerank(
        self,
        query: str,
        chunks: list[RetrievedChunk],
        top_n: int = 5,
    ) -> list[RetrievedChunk]:
        """Rerank chunks using Cohere; fallback to original order on error.

        Args:
            query: Query string
            chunks: Chunks to rerank
            top_n: Number of results to return

        Returns:
            Top-n chunks reranked by Cohere score, or original top-n on error.
        """
        if not chunks:
            return []

        try:
            documents = [c.chunk_text for c in chunks]

            # Call Cohere with timeout
            results = await asyncio.wait_for(
                self.client.rerank(
                    model=self.model,
                    query=query,
                    documents=documents,
                    top_n=min(top_n, len(chunks)),
                ),
                timeout=2.0,
            )

            # Map Cohere scores back to chunks
            reranked = []
            for result in results.results:
                chunk = chunks[result.index]
                chunk.score = result.relevance_score
                reranked.append(chunk)

            logger.info(f"Reranked {len(results.results)} chunks with Cohere")
            return reranked

        except asyncio.TimeoutError:
            logger.warning("Cohere rerank timeout (>2s); returning top_n chunks unchanged")
            return chunks[:top_n]
        except Exception as e:
            logger.warning(f"Cohere rerank failed: {e}; returning top_n chunks unchanged")
            return chunks[:top_n]
