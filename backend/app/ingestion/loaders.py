import logging
from dataclasses import dataclass

import fitz  # PyMuPDF

from app.db.models import SourceType

logger = logging.getLogger(__name__)


@dataclass
class DocumentPages:
    document_id: str
    filename: str
    source_type: SourceType
    pages: list[str]


async def load_pdf(file_bytes: bytes) -> list[str]:
    """Extract text page by page using PyMuPDF. Strip empty pages."""
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages: list[str] = []
    for page in doc:
        text = page.get_text().strip()
        if text:
            pages.append(text)
    doc.close()
    logger.info("Extracted %d non-empty pages from PDF", len(pages))
    return pages


async def load_text(content: str) -> list[str]:
    """Split on double newlines. Strip paragraphs shorter than 50 chars."""
    paragraphs = content.split("\n\n")
    result = [p.strip() for p in paragraphs if len(p.strip()) >= 50]
    logger.info("Extracted %d paragraphs from text", len(result))
    return result


async def load_document(
    document_id: str,
    filename: str,
    source_type: SourceType,
    file_bytes: bytes,
) -> DocumentPages:
    """Route to the correct loader based on source_type."""
    if source_type == SourceType.PDF:
        pages = await load_pdf(file_bytes)
    elif source_type == SourceType.TEXT:
        content = file_bytes.decode("utf-8")
        pages = await load_text(content)
    else:
        raise ValueError(f"Unsupported source type: {source_type}")

    return DocumentPages(
        document_id=document_id,
        filename=filename,
        source_type=source_type,
        pages=pages,
    )
