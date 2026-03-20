from app.ingestion.chunker import chunk_pages


def test_chunk_count_reasonable() -> None:
    """A 3-page mock text should produce a reasonable number of chunks."""
    pages = [
        "This is the first page of content. " * 30,  # ~1050 chars
        "Second page has different content. " * 25,  # ~875 chars
        "Third page wraps up the document. " * 20,  # ~680 chars
    ]
    chunks = chunk_pages(pages, document_id="test-doc-id")
    assert len(chunks) >= 3  # at least one chunk per page
    assert len(chunks) <= 15  # reasonable upper bound


def test_chunk_max_size() -> None:
    """Each chunk should be <= 800 chars."""
    pages = ["A long paragraph of text. " * 100]  # ~2600 chars
    chunks = chunk_pages(pages, document_id="test-doc-id")
    for chunk in chunks:
        assert len(chunk.text) <= 900  # allow small overlap margin


def test_parent_doc_id_consistent() -> None:
    """Chunks from the same page should have the same parent_doc_id."""
    page_text = "Some content that will be chunked. " * 40  # ~1400 chars -> multiple chunks
    chunks = chunk_pages([page_text], document_id="test-doc-id")
    assert len(chunks) >= 2
    parent_ids = {c.parent_doc_id for c in chunks}
    assert len(parent_ids) == 1  # all same parent


def test_chunk_index_sequential() -> None:
    """chunk_index should be sequential within each parent."""
    pages = ["Content for page one. " * 40, "Content for page two. " * 40]
    chunks = chunk_pages(pages, document_id="test-doc-id")

    # Group by parent_doc_id
    by_parent: dict[str, list[int]] = {}
    for c in chunks:
        by_parent.setdefault(c.parent_doc_id, []).append(c.chunk_index)

    for parent_id, indexes in by_parent.items():
        assert indexes == list(range(len(indexes))), (
            f"Chunk indexes not sequential for parent {parent_id}: {indexes}"
        )


def test_document_id_propagated() -> None:
    """All chunks should carry the document_id."""
    doc_id = "my-test-document-uuid"
    chunks = chunk_pages(["Some test content. " * 20], document_id=doc_id)
    for chunk in chunks:
        assert chunk.document_id == doc_id


def test_different_pages_different_parent_ids() -> None:
    """Different pages should produce different parent_doc_ids."""
    pages = [
        "First page with unique content about machine learning algorithms.",
        "Second page discussing neural network architectures and training.",
    ]
    chunks = chunk_pages(pages, document_id="test-doc-id")
    parent_ids = {c.parent_doc_id for c in chunks}
    assert len(parent_ids) == 2
