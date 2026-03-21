"""Fetch parent document sections for context."""

import logging
from collections import defaultdict

from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue

from app.retrieval.types import RetrievedChunk

logger = logging.getLogger(__name__)


async def fetch_parent_sections(
    chunks: list[RetrievedChunk],
    qdrant_client: AsyncQdrantClient,
    collection_name: str,
    score_threshold: float = 0.85,
) -> list[str]:
    """Fetch full parent sections for high-scoring chunks.

    For each chunk with score > threshold, retrieves all chunks from the same parent_doc_id
    and concatenates them into a section string.

    Args:
        chunks: List of RetrievedChunk objects
        qdrant_client: Async Qdrant client
        collection_name: Qdrant collection name
        score_threshold: Only fetch parents for chunks above this score

    Returns:
        List of parent section strings (deduplicated by parent_doc_id), max 10.
    """
    high_scoring = [c for c in chunks if c.score > score_threshold]

    if not high_scoring:
        logger.info(f"No chunks above threshold {score_threshold}; returning empty parent sections")
        return []

    # Group by parent_doc_id to fetch once per parent
    parent_sections_map: dict[str, list[str]] = {}

    for chunk in high_scoring:
        parent_id = chunk.parent_doc_id

        if parent_id in parent_sections_map:
            continue  # Already fetched this parent

        try:
            # Query Qdrant for all chunks with this parent_doc_id using native filtering
            points = await qdrant_client.scroll(
                collection_name=collection_name,
                scroll_filter=Filter(must=[
                    FieldCondition(key="parent_doc_id", match=MatchValue(value=parent_id))
                ]),
                limit=1000,
            )

            # Points are already filtered by Qdrant, sort by chunk_index
            parent_chunks = points[0]
            parent_chunks.sort(key=lambda p: p.payload.get("chunk_index", 0))

            # Concatenate chunk texts
            texts = [p.payload.get("chunk_text", "") for p in parent_chunks]
            parent_section = "\n\n".join(texts)
            parent_sections_map[parent_id] = texts

            logger.info(
                f"Fetched parent section {parent_id} with "
                f"{len(parent_chunks)} chunks ({len(parent_section)} chars)"
            )

        except Exception as e:
            logger.warning(f"Failed to fetch parent section {parent_id}: {e}")
            continue

    # Return concatenated sections, limit to 10
    sections = ["\n\n".join(texts) for texts in parent_sections_map.values()]
    return sections[:10]
