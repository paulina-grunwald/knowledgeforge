"""Integration tests for retrieval pipeline (requires Docker services)."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.models import Corpus
from app.db.redis_client import get_redis
from app.retrieval.hybrid import HybridRetriever, rrf_fuse
from app.retrieval.pipeline import RetrievalPipeline
from app.retrieval.reranker import CohereReranker


@pytest.mark.asyncio
class TestRRFAlgorithm:
    """Test RRF fusion algorithm."""

    async def test_rrf_both_lists(self):
        """Doc in both lists ranks higher than doc in one list."""
        semantic = {("doc1", 0): 0.9, ("doc2", 0): 0.8}
        lexical = {("doc1", 0): 0.85, ("doc3", 0): 0.7}

        result = rrf_fuse(semantic, lexical, k=60)
        result_dict = dict(result)

        assert result[0][0] == ("doc1", 0)
        assert result_dict[("doc1", 0)] > result_dict[("doc2", 0)]

    async def test_rrf_empty_inputs(self):
        """Empty inputs return empty results."""
        result = rrf_fuse({}, {}, k=60)
        assert result == []

    async def test_rrf_single_source(self):
        """Single source returns correctly ranked results."""
        semantic = {("doc1", 0): 0.9, ("doc2", 0): 0.8}
        lexical = {}

        result = rrf_fuse(semantic, lexical, k=60)

        assert len(result) == 2
        assert result[0][0] == ("doc1", 0)  # Higher semantic score ranks first
        assert result[1][0] == ("doc2", 0)


@pytest.mark.asyncio
class TestHybridRetriever:
    """Test HybridRetriever with mock data."""

    async def test_retriever_initialization(self):
        """Test HybridRetriever initialization."""
        chunks = ["chunk 1 text", "chunk 2 text", "chunk 3 text"]
        payloads = [
            {
                "chunk_text": "chunk 1 text",
                "parent_doc_id": "doc1",
                "chunk_index": 0,
                "concept_id": "",
                "source_page": 1,
            },
            {
                "chunk_text": "chunk 2 text",
                "parent_doc_id": "doc1",
                "chunk_index": 1,
                "concept_id": "",
                "source_page": 1,
            },
            {
                "chunk_text": "chunk 3 text",
                "parent_doc_id": "doc2",
                "chunk_index": 0,
                "concept_id": "",
                "source_page": 2,
            },
        ]

        # Create mock Qdrant client
        from unittest.mock import AsyncMock

        qdrant = AsyncMock()

        retriever = HybridRetriever(
            qdrant_client=qdrant,
            collection_name="test_collection",
            corpus_chunks=chunks,
            corpus_chunk_payloads=payloads,
            top_k=2,
        )

        assert retriever.chunk_texts == chunks
        assert retriever.payloads == payloads
        assert len(retriever.chunk_texts) == 3


@pytest.mark.asyncio
class TestCohereReranker:
    """Test CohereReranker with mock."""

    async def test_reranker_initialization(self):
        """Test CohereReranker initialization."""
        reranker = CohereReranker(api_key="test-key")
        assert reranker.model == "rerank-english-v3.0"

    async def test_reranker_fallback_on_empty(self):
        """Test reranker returns empty on empty input."""
        reranker = CohereReranker(api_key="test-key")
        result = await reranker.rerank("test query", [], top_n=5)
        assert result == []


@pytest.mark.asyncio
class TestRetrievalPipeline:
    """Test RetrievalPipeline orchestration."""

    async def test_pipeline_initialization(self):
        """Test RetrievalPipeline initialization."""
        from unittest.mock import AsyncMock

        retriever = AsyncMock()
        reranker = AsyncMock()

        pipeline = RetrievalPipeline(retriever, reranker)

        assert pipeline.hybrid == retriever
        assert pipeline.reranker == reranker

    async def test_pipeline_cache_miss(self):
        """Test pipeline handles cache miss."""
        from unittest.mock import AsyncMock, patch

        retriever = AsyncMock()
        reranker = AsyncMock()
        redis = await get_redis()

        # Ensure cache is empty
        cache_key = f"retrieval:None:{hash('test concept')}"
        await redis.delete(cache_key)

        pipeline = RetrievalPipeline(retriever, reranker)

        # Mock the underlying operations
        retriever.retrieve.return_value = []
        reranker.rerank.return_value = []

        with patch("app.retrieval.pipeline.expand_query") as mock_expand:
            mock_expand.return_value = ["expanded1", "expanded2", "expanded3"]

            result = await pipeline.retrieve("test concept")

            assert result.chunks == []
            assert result.query_expansions == ["expanded1", "expanded2", "expanded3"]
            assert result.latency_ms >= 0

    async def test_pipeline_logging(self, caplog):
        """Test pipeline logs operations."""
        import logging

        from unittest.mock import AsyncMock, patch

        caplog.set_level(logging.INFO)

        retriever = AsyncMock()
        reranker = AsyncMock()

        retriever.retrieve.return_value = []
        reranker.rerank.return_value = []

        pipeline = RetrievalPipeline(retriever, reranker)

        with patch("app.retrieval.pipeline.expand_query") as mock_expand:
            mock_expand.return_value = []
            await pipeline.retrieve("test")

        # Check that logging happened
        log_output = caplog.text
        assert "Retrieval complete" in log_output or "retrieval" in log_output.lower()


@pytest.mark.asyncio
class TestIntegrationWithDatabase:
    """Integration tests with actual database."""

    async def test_corpus_ready_status(self, test_corpus: Corpus):
        """Test that test corpus has ready status."""
        assert test_corpus.status.value == "ready"
        assert test_corpus.chunk_count == 10

    async def test_redis_operations(self):
        """Test Redis client operations."""
        redis = await get_redis()

        # Test set/get
        await redis.set("test_key", "test_value")
        value = await redis.get("test_key")
        assert value == "test_value"

        # Test delete
        await redis.delete("test_key")
        value = await redis.get("test_key")
        assert value is None

    async def test_redis_cache_key_format(self):
        """Test Redis cache key formatting."""
        redis = await get_redis()

        cache_key = "retrieval:concept-id:12345"
        await redis.set(cache_key, "cached_result")

        value = await redis.get(cache_key)
        assert value == "cached_result"

        # Clean up
        await redis.delete(cache_key)


# Mark all tests as requiring Docker services
pytestmark = pytest.mark.integration
