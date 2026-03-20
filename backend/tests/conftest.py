"""Pytest configuration and shared fixtures for integration tests."""

import asyncio
import logging
from uuid import UUID, uuid4

import pytest
from qdrant_client import AsyncQdrantClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.db.models import Base, Corpus, CorpusStatus, Document, SourceType, User
from app.db.redis_client import close_redis, get_redis

logger = logging.getLogger(__name__)

# Test database URL (use test-specific DB)
TEST_DATABASE_URL = "postgresql+asyncpg://kg:kg@localhost:5433/knowledgeforge_test"




@pytest.fixture
async def test_db_engine():
    """Create test database engine (session scope for efficiency)."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        connect_args={"timeout": 10},
    )

    try:
        # Create tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Created test tables")
    except Exception as e:
        logger.warning(f"Could not connect to test database: {e}")
        pytest.skip("Test database not available")

    yield engine

    # Clean up - drop tables but leave database intact
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        logger.info("Dropped test tables")
    except Exception as e:
        logger.warning(f"Could not drop tables: {e}")

    await engine.dispose()


@pytest.fixture
async def db_session(test_db_engine):
    """Get async database session for each test."""
    async_session = sessionmaker(
        test_db_engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def redis_client():
    """Get Redis client for each test."""
    redis = await get_redis()
    yield redis
    # Clear test keys
    try:
        await redis.flushdb()
    except Exception as e:
        logger.warning(f"Could not flush Redis: {e}")


@pytest.fixture
async def qdrant_client():
    """Get Qdrant client for each test."""
    client = AsyncQdrantClient(url=settings.qdrant_url)
    yield client


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user."""
    user = User(id=uuid4(), email="test@knowledgeforge.local")
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_document(db_session: AsyncSession, test_user: User) -> Document:
    """Create a test document."""
    document = Document(
        id=uuid4(),
        user_id=test_user.id,
        filename="test_document.pdf",
        source_type=SourceType.PDF,
        content_hash="abc123def456",
        size_bytes=1024,
    )
    db_session.add(document)
    await db_session.commit()
    await db_session.refresh(document)
    return document


@pytest.fixture
async def test_corpus(
    db_session: AsyncSession, test_user: User, test_document: Document
) -> Corpus:
    """Create a test corpus (study set) in READY status."""
    corpus = Corpus(
        id=uuid4(),
        user_id=test_user.id,
        name="Test Corpus",
        status=CorpusStatus.READY,
        chunk_count=10,
    )
    db_session.add(corpus)
    db_session.add_all([corpus])  # Ensure document is in session
    await db_session.commit()
    await db_session.refresh(corpus)
    return corpus


@pytest.fixture(autouse=True)
async def cleanup_redis(request):
    """Auto-cleanup Redis after each test (skip if Redis not available)."""
    yield
    # Reset Redis connection between tests to avoid event loop conflicts
    from app.db.redis_client import close_redis

    try:
        # Close the old connection
        await close_redis()
    except Exception as e:
        logger.debug(f"Redis cleanup failed: {e}")
