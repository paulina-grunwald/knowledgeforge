import logging

from openai import AsyncOpenAI

from app.config import settings
from app.ingestion.chunker import Chunk

logger = logging.getLogger(__name__)

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    """Get or create async OpenAI client (lazy-loaded to avoid loading on import)."""
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _client


async def embed_chunks(chunks: list[Chunk]) -> list[list[float]]:
    """Embed chunks using OpenAI text-embedding-3-small (1536 dims).

    Batches in groups of 100 to respect rate limits.
    Returns list of 1536-dim float vectors, same order as input.
    """
    client = _get_client()
    texts = [c.text for c in chunks]
    embeddings_list = []

    for i in range(0, len(texts), 100):
        batch = texts[i : i + 100]
        response = await client.embeddings.create(
            model="text-embedding-3-small",
            input=batch,
        )
        embeddings_list.extend([e.embedding for e in response.data])
        logger.info(f"Embedded batch {i // 100 + 1}/{(len(texts) + 99) // 100}")

    logger.info("Embedded %d chunks total", len(chunks))
    return embeddings_list


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed multiple texts (concepts, definitions) in batches.

    Batches in groups of 100 to respect rate limits.
    Returns list of 1536-dim float vectors, same order as input.
    """
    client = _get_client()
    embeddings_list = []

    for i in range(0, len(texts), 100):
        batch = texts[i : i + 100]
        response = await client.embeddings.create(
            model="text-embedding-3-small",
            input=batch,
        )
        embeddings_list.extend([e.embedding for e in response.data])
        logger.info(f"Embedded batch {i // 100 + 1}/{(len(texts) + 99) // 100}")

    logger.info("Embedded %d texts total", len(texts))
    return embeddings_list


async def embed_single(text: str) -> list[float]:
    """Single embedding for concept-level queries (1536 dims)."""
    client = _get_client()
    response = await client.embeddings.create(
        model="text-embedding-3-small",
        input=text,
    )
    return response.data[0].embedding
