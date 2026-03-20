import logging

from sentence_transformers import SentenceTransformer

from app.config import EMBEDDING_MODEL, EMBEDDING_DIMENSION
from app.ingestion.chunker import Chunk

logger = logging.getLogger(__name__)

MODEL_NAME = EMBEDDING_MODEL
VECTOR_SIZE = EMBEDDING_DIMENSION

_model: SentenceTransformer | None = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        logger.info("Loading embedding model: %s", MODEL_NAME)
        _model = SentenceTransformer(MODEL_NAME)
    return _model


async def embed_chunks(chunks: list[Chunk]) -> list[list[float]]:
    """Embed chunks using local sentence-transformers model.

    Returns list of 768-dim float vectors, same order as input.
    """
    model = _get_model()
    texts = [c.text for c in chunks]
    embeddings = model.encode(texts, show_progress_bar=False, convert_to_numpy=True)
    logger.info("Embedded %d chunks", len(chunks))
    return [emb.tolist() for emb in embeddings]


async def embed_single(text: str) -> list[float]:
    """Single embedding for concept-level queries."""
    model = _get_model()
    embedding = model.encode([text], show_progress_bar=False, convert_to_numpy=True)
    return embedding[0].tolist()
