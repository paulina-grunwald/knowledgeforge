import difflib
import logging
from uuid import UUID

import anthropic
import instructor
from pydantic import BaseModel

from app.config import settings

logger = logging.getLogger(__name__)
MAX_CORPUS_CHARS = 80_000

SYSTEM_PROMPT = """You are a knowledge graph builder. Extract all distinct concepts \
from the provided text. A concept is a discrete, testable unit of knowledge — not a \
chapter title or general topic.

For each concept provide:
  - name: short, specific label (3–6 words max)
  - definition: 1–3 sentence explanation in the author's own words
  - prerequisites: list of other concept names from THIS text that must be understood \
first. Empty list if none.

Return only concepts explicitly present in the text."""


class ExtractedConcept(BaseModel):
    name: str
    definition: str
    prerequisites: list[str]


class ConceptExtractionResult(BaseModel):
    concepts: list[ExtractedConcept]


async def extract_concepts(corpus_text: str) -> ConceptExtractionResult:
    """Extract concepts from corpus text using Claude via instructor.

    Truncates to 80k chars if longer.
    """
    truncated = corpus_text[:MAX_CORPUS_CHARS]

    client = instructor.from_anthropic(
        anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    )

    result = await client.chat.completions.create(
        model=settings.concept_extraction_model,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": truncated}],
        response_model=ConceptExtractionResult,
    )

    logger.info("Extracted %d concepts from corpus text", len(result.concepts))
    return result


def resolve_prerequisites(
    concepts: list[ExtractedConcept],
    stored_concepts: list[dict[str, str]],
) -> dict[str, list[UUID]]:
    """Match prerequisite names to concept IDs.

    Uses exact match first, then fuzzy match (SequenceMatcher ratio > 0.85).
    Unresolved prerequisites are silently dropped.

    Args:
        concepts: Extracted concepts with prerequisite names.
        stored_concepts: List of {"id": UUID-string, "name": str} dicts.

    Returns:
        Dict mapping concept_name -> list of prerequisite concept UUIDs.
    """
    name_to_id: dict[str, UUID] = {}
    for sc in stored_concepts:
        name_to_id[sc["name"].lower()] = UUID(sc["id"])

    stored_names = list(name_to_id.keys())
    result: dict[str, list[UUID]] = {}

    for concept in concepts:
        resolved_ids: list[UUID] = []

        for prereq_name in concept.prerequisites:
            prereq_lower = prereq_name.lower()

            # Exact match
            if prereq_lower in name_to_id:
                resolved_ids.append(name_to_id[prereq_lower])
                continue

            # Fuzzy match (O(n) for each prerequisite - O(n²) overall)
            # TODO Phase 2: Replace with rapidfuzz for better performance at scale
            best_match: str | None = None
            best_ratio = 0.0
            for stored_name in stored_names:
                ratio = difflib.SequenceMatcher(None, prereq_lower, stored_name).ratio()
                if ratio > best_ratio:
                    best_ratio = ratio
                    best_match = stored_name
                    # Early exit for near-perfect matches
                    if best_ratio > 0.95:
                        break

            if best_match is not None and best_ratio > 0.85:
                resolved_ids.append(name_to_id[best_match])
                logger.debug(
                    "Fuzzy matched '%s' to '%s' (ratio=%.2f)",
                    prereq_name,
                    best_match,
                    best_ratio,
                )
            else:
                logger.debug("Dropped unresolvable prerequisite: '%s'", prereq_name)

        result[concept.name] = resolved_ids

    return result
