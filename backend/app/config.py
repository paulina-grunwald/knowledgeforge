from pathlib import Path

from pydantic_settings import BaseSettings

_BACKEND_DIR = Path(__file__).resolve().parent.parent

EMBEDDING_DIMENSION = 1536


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    cohere_api_key: str = ""
    openai_api_key: str = ""
    qdrant_url: str = "http://localhost:6333"
    database_url: str = "postgresql+asyncpg://kg:kg@localhost:5432/knowledgeforge"
    redis_url: str = "redis://localhost:6379"
    upload_dir: str = "./uploads"
    max_upload_size_bytes: int = 50 * 1024 * 1024  # 50 MB
    concept_extraction_model: str = "claude-sonnet-4-5-20250929"
    embedding_dimension: int = EMBEDDING_DIMENSION

    model_config = {
        "env_file": str(_BACKEND_DIR / ".env"),
        "env_file_encoding": "utf-8",
    }


settings = Settings()
