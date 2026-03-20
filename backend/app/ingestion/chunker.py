import hashlib
import logging
from dataclasses import dataclass

from langchain_text_splitters import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)


@dataclass
class Chunk:
    text: str
    parent_doc_id: str
    chunk_index: int
    source_page: int | None
    document_id: str
    document_title: str = ""
    source_type: str = ""


def chunk_pages(
    pages: list[str],
    document_id: str,
    document_title: str = "",
    source_type: str = "",
) -> list[Chunk]:
    """Chunk pages using RecursiveCharacterTextSplitter.

    Args:
        pages: List of page/paragraph strings.
        document_id: UUID of the source Document.
        document_title: Filename of the source document.
        source_type: Source type (pdf, text, notion).

    Returns:
        List of Chunk objects with sequential chunk_index per parent.

    Config:
        chunk_size=800, chunk_overlap=100, separators=["\n\n", "\n", ". "]
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=100,
        separators=["\n\n", "\n", ". "],
    )

    chunks: list[Chunk] = []

    for page_idx, page_text in enumerate(pages):
        parent_doc_id = hashlib.sha256(page_text.encode()).hexdigest()[:16]
        page_chunks = splitter.split_text(page_text)

        for chunk_idx, chunk_text in enumerate(page_chunks):
            chunks.append(
                Chunk(
                    text=chunk_text,
                    parent_doc_id=parent_doc_id,
                    chunk_index=chunk_idx,
                    source_page=page_idx,
                    document_id=document_id,
                    document_title=document_title,
                    source_type=source_type,
                )
            )

    logger.info(
        "Chunked %d pages into %d chunks for document %s",
        len(pages),
        len(chunks),
        document_id,
    )
    return chunks
