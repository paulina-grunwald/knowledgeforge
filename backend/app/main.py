import logging
from uuid import UUID

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.api import corpora, documents
from app.db.models import User
from app.db.session import async_session_factory

logger = logging.getLogger(__name__)

# Hardcoded test user for Phase 1 (no auth yet)
TEST_USER_ID = UUID("00000000-0000-4000-8000-000000000001")
TEST_USER_EMAIL = "test@knowledgeforge.local"


def create_app() -> FastAPI:
    app = FastAPI(
        title="KnowledgeForge",
        description="Adaptive AI study agent with spaced repetition",
        version="0.1.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(documents.router)
    app.include_router(corpora.router)

    @app.on_event("startup")
    async def ensure_test_user() -> None:
        async with async_session_factory() as session:
            result = await session.execute(
                select(User).where(User.id == TEST_USER_ID)
            )
            if result.scalar_one_or_none() is None:
                session.add(User(id=TEST_USER_ID, email=TEST_USER_EMAIL))
                await session.commit()
                logger.info("Created test user %s", TEST_USER_ID)

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
