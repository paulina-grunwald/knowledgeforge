"""Unit tests for Reciprocal Rank Fusion (RRF) algorithm."""

from app.retrieval.hybrid import rrf_fuse


def test_rrf_both_lists():
    """Doc in both lists ranks higher than doc in one list."""
    semantic = {("doc1", 0): 0.9, ("doc2", 0): 0.8}
    lexical = {("doc1", 0): 0.85, ("doc3", 0): 0.7}

    result = rrf_fuse(semantic, lexical, k=60)
    result_dict = dict(result)

    # doc1 should rank first (in both result sets)
    assert result[0][0] == ("doc1", 0)

    # doc1 score should be higher than doc2 or doc3
    assert result_dict[("doc1", 0)] > result_dict[("doc2", 0)]
    assert result_dict[("doc1", 0)] > result_dict[("doc3", 0)]


def test_rrf_semantic_only():
    """Doc only in semantic search gets penalized but still ranks."""
    semantic = {("doc1", 0): 0.9}
    lexical = {}

    result = rrf_fuse(semantic, lexical, k=60)
    result_dict = dict(result)

    # doc1 should be in results
    assert ("doc1", 0) in result_dict
    # Score should be low (1/(60+1) only from semantic)
    assert result_dict[("doc1", 0)] < 0.02


def test_rrf_lexical_only():
    """Doc only in lexical search gets penalized but still ranks."""
    semantic = {}
    lexical = {("doc1", 0): 0.7}

    result = rrf_fuse(semantic, lexical, k=60)
    result_dict = dict(result)

    # doc1 should be in results
    assert ("doc1", 0) in result_dict
    # Score should be low (1/(60+1) only from lexical)
    assert result_dict[("doc1", 0)] < 0.02


def test_rrf_fusion_order():
    """Highest RRF score comes first."""
    semantic = {("doc1", 0): 0.95, ("doc2", 0): 0.85, ("doc3", 0): 0.70}
    lexical = {("doc1", 0): 0.90, ("doc2", 0): 0.80, ("doc3", 0): 0.75}

    result = rrf_fuse(semantic, lexical, k=60)

    # doc1 has highest fused score (appears best in both)
    assert result[0][0] == ("doc1", 0)
    # doc2 should rank second
    assert result[1][0] == ("doc2", 0)
    # doc3 should rank third
    assert result[2][0] == ("doc3", 0)


def test_rrf_empty_inputs():
    """Empty inputs return empty results."""
    result = rrf_fuse({}, {}, k=60)
    assert result == []


def test_rrf_single_result():
    """Single result from one method returns correctly."""
    semantic = {("doc1", 0): 0.9}
    lexical = {("doc1", 0): 0.85}

    result = rrf_fuse(semantic, lexical, k=60)

    assert len(result) == 1
    assert result[0][0] == ("doc1", 0)
    # Score should be sum of two RRF terms
    rrf_score = 1 / (60 + 1) + 1 / (60 + 1)  # Both rank 1st in their lists
    assert abs(result[0][1] - rrf_score) < 0.0001


def test_rrf_with_different_k():
    """RRF parameter k affects score magnitudes but not order."""
    semantic = {("doc1", 0): 0.9, ("doc2", 0): 0.8}
    lexical = {("doc1", 0): 0.85, ("doc2", 0): 0.75}

    result_k60 = rrf_fuse(semantic, lexical, k=60)
    result_k30 = rrf_fuse(semantic, lexical, k=30)

    # Order should be the same
    assert result_k60[0][0] == result_k30[0][0]
    assert result_k60[1][0] == result_k30[1][0]

    # But scores should be different
    assert result_k60[0][1] != result_k30[0][1]

    # Higher k should give lower scores (farther from the k+1 denominator)
    assert result_k60[0][1] < result_k30[0][1]
