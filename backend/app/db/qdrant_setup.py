import logging

from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Distance, PayloadSchemaType, VectorParams

from app.config import EMBEDDING_DIMENSION

logger = logging.getLogger(__name__)

VECTOR_SIZE = EMBEDDING_DIMENSION
DISTANCE = Distance.COSINE


async def ensure_collection(
    client: AsyncQdrantClient, user_id: str, corpus_id: str
) -> str:
    """Create Qdrant collection for a user+corpus pair if it doesn't exist.

    Collection name: f"{user_id}_{corpus_id}"
    Vector config: size=768, distance=COSINE
    Payload indexes:
      - concept_id: keyword
      - knowledge_state: keyword
      - parent_doc_id: keyword
      - document_id: keyword
      - source_type: keyword

    Point payload schema (not enforced by Qdrant):
      chunk_text: str
      concept_id: str (UUID)
      parent_doc_id: str
      document_id: str (UUID)
      document_title: str
      source_type: str (pdf, text, notion)
      source_page: int | None
      chunk_index: int

    Returns collection name.
    """
    collection_name = f"{user_id}_{corpus_id}"

    collections = await client.get_collections()
    existing_names = {c.name for c in collections.collections}

    if collection_name not in existing_names:
        await client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=DISTANCE),
        )
        logger.info("Created Qdrant collection: %s", collection_name)

        for field_name in ("concept_id", "knowledge_state", "parent_doc_id", "document_id", "source_type"):
            await client.create_payload_index(
                collection_name=collection_name,
                field_name=field_name,
                field_schema=PayloadSchemaType.KEYWORD,
            )
        logger.info("Created payload indexes for %s", collection_name)
    else:
        logger.info("Qdrant collection already exists: %s", collection_name)

    return collection_name
