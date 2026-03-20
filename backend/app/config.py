from pathlib import Path

from pydantic_settings import BaseSettings

_BACKEND_DIR = Path(__file__).resolve().parent.parent

# Embedding model configuration (Phase 1 uses local sentence-transformers)
# Phase 2 will migrate to OpenAI text-embedding-3-small (1536 dims)
EMBEDDING_MODEL = "all-mpnet-base-v2"
EMBEDDING_DIMENSION = 768


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    cohere_api_key: str = ""
    qdrant_url: str = "http://localhost:6333"
    database_url: str = "postgresql+asyncpg://kg:kg@localhost:5432/knowledgeforge"
    redis_url: str = "redis://localhost:6379"
    upload_dir: str = "./uploads"
    max_upload_size_bytes: int = 50 * 1024 * 1024  # 50 MB
    concept_extraction_model: str = "claude-haiku-4-5-20251001"
    embedding_dimension: int = EMBEDDING_DIMENSION

    model_config = {
        "env_file": str(_BACKEND_DIR / ".env"),
        "env_file_encoding": "utf-8",
    }


settings = Settings()
