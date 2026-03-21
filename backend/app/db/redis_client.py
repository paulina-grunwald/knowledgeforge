"""Redis client for caching and session management."""

import logging

from redis.asyncio import Redis, ConnectionPool

from app.config import settings

logger = logging.getLogger(__name__)

_redis: Redis | None = None


async def get_redis() -> Redis:
    """Get or create async Redis client with connection pooling."""
    global _redis
    if _redis is None:
        pool = ConnectionPool.from_url(settings.redis_url, decode_responses=True)
        _redis = Redis(connection_pool=pool)
        await _redis.ping()
        logger.info("Redis connected")
    return _redis


async def close_redis() -> None:
    """Close Redis connection."""
    global _redis
    if _redis:
        await _redis.close()
        _redis = None
        logger.info("Redis disconnected")
