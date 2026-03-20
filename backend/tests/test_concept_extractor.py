from uuid import UUID, uuid4

from app.ingestion.concept_extractor import ExtractedConcept, resolve_prerequisites


def _make_stored_concepts(names: list[str]) -> list[dict[str, str]]:
    return [{"id": str(uuid4()), "name": name} for name in names]


def test_exact_match() -> None:
    """resolve_prerequisites resolves exact name match."""
    stored = _make_stored_concepts(["Neural Networks", "Backpropagation"])
    concepts = [
        ExtractedConcept(
            name="Gradient Descent",
            definition="An optimization algorithm.",
            prerequisites=["Neural Networks"],
        )
    ]

    result = resolve_prerequisites(concepts, stored)
    assert len(result["Gradient Descent"]) == 1
    assert result["Gradient Descent"][0] == UUID(stored[0]["id"])


def test_exact_match_case_insensitive() -> None:
    """Exact matching should be case-insensitive."""
    stored = _make_stored_concepts(["Neural Networks"])
    concepts = [
        ExtractedConcept(
            name="Test",
            definition="Test def.",
            prerequisites=["neural networks"],
        )
    ]

    result = resolve_prerequisites(concepts, stored)
    assert len(result["Test"]) == 1


def test_fuzzy_match() -> None:
    """resolve_prerequisites resolves fuzzy match (ratio > 0.85)."""
    stored = _make_stored_concepts(["Backpropagation Algorithm"])
    concepts = [
        ExtractedConcept(
            name="Test",
            definition="Test def.",
            prerequisites=["Backpropagation Algoritm"],  # typo
        )
    ]

    result = resolve_prerequisites(concepts, stored)
    assert len(result["Test"]) == 1


def test_silent_drop_unresolvable() -> None:
    """resolve_prerequisites silently drops unresolvable names."""
    stored = _make_stored_concepts(["Neural Networks"])
    concepts = [
        ExtractedConcept(
            name="Test",
            definition="Test def.",
            prerequisites=["Quantum Computing"],  # not in stored
        )
    ]

    result = resolve_prerequisites(concepts, stored)
    assert len(result["Test"]) == 0


def test_multiple_prerequisites() -> None:
    """Multiple prerequisites should all be resolved."""
    stored = _make_stored_concepts(["Linear Algebra", "Calculus", "Statistics"])
    concepts = [
        ExtractedConcept(
            name="Machine Learning",
            definition="ML definition.",
            prerequisites=["Linear Algebra", "Calculus"],
        )
    ]

    result = resolve_prerequisites(concepts, stored)
    assert len(result["Machine Learning"]) == 2


def test_no_prerequisites() -> None:
    """Concepts with empty prerequisites should return empty list."""
    stored = _make_stored_concepts(["Neural Networks"])
    concepts = [
        ExtractedConcept(
            name="Basics",
            definition="Basic def.",
            prerequisites=[],
        )
    ]

    result = resolve_prerequisites(concepts, stored)
    assert result["Basics"] == []


def test_fuzzy_below_threshold_drops() -> None:
    """Fuzzy matches below 0.85 ratio should be dropped."""
    stored = _make_stored_concepts(["Neural Networks"])
    concepts = [
        ExtractedConcept(
            name="Test",
            definition="Test def.",
            prerequisites=["XYZ Completely Different"],  # very different
        )
    ]

    result = resolve_prerequisites(concepts, stored)
    assert len(result["Test"]) == 0
