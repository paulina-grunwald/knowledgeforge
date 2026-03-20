"""Multi-query expansion using Claude for diverse search variations."""

import hashlib
import json
import logging

from anthropic import AsyncAnthropic

from app.db.redis_client import get_redis

logger = logging.getLogger(__name__)


async def expand_query(concept_name: str) -> list[str]:
    """Generate 3 query variations via Claude, cache in Redis.

    Args:
        concept_name: The concept name to expand

    Returns:
        List of 3 query variations (original query NOT included).
        Falls back to [concept_name] on any error.
    """
    redis = await get_redis()

    # Check Redis cache
    cache_key = f"qexp:{hashlib.sha256(concept_name.encode()).hexdigest()[:12]}"
    try:
        cached = await redis.get(cache_key)
        if cached:
            logger.info(f"Cache hit for query expansion: {concept_name}")
            return json.loads(cached)
    except Exception as e:
        logger.warning(f"Redis cache read failed: {e}")

    try:
        from app.config import settings

        client = AsyncAnthropic(api_key=settings.anthropic_api_key)
        message = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=300,
            system="""Generate 3 different rephrasings of the provided concept name for use as search queries.
Each rephrasing should approach the concept from a different angle:
- One definitional ("What is X?" or "Definition of X")
- One applied ("When/how is X used?" or "Applications of X")
- One relational ("How does X relate to adjacent concepts?" or "X and its connections")

Return ONLY the 3 queries, one per line, no numbering or explanation.""",
            messages=[{"role": "user", "content": f"Concept: {concept_name}"}],
        )

        # Parse response - split by newlines and filter empty
        response_text = message.content[0].text
        queries = [q.strip() for q in response_text.split("\n") if q.strip()]

        # Take first 3
        queries = queries[:3]

        # Cache result for 1 hour
        try:
            await redis.setex(cache_key, 3600, json.dumps(queries))
            logger.info(f"Cached query expansion for {concept_name}: {queries}")
        except Exception as e:
            logger.warning(f"Redis cache write failed: {e}")

        return queries

    except Exception as e:
        logger.warning(f"Query expansion failed for '{concept_name}': {e}; falling back to original")
        return [concept_name]
