import logging
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.schemas.documents import DocumentListItem, DocumentListResponse, DocumentResponse
from app.config import settings
from app.db.models import Document, SourceType, corpus_documents
from app.db.session import get_db
from app.ingestion.loaders import load_pdf
from app.ingestion.storage import FileStorage

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["documents"])

EXTENSION_TO_SOURCE_TYPE: dict[str, SourceType] = {
    ".pdf": SourceType.PDF,
    ".txt": SourceType.TEXT,
    ".md": SourceType.TEXT,
}


def get_storage() -> FileStorage:
    return FileStorage(settings.upload_dir)


@router.post("", response_model=DocumentResponse, status_code=201)
async def upload_document(
    user_id: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    storage: FileStorage = Depends(get_storage),
) -> DocumentResponse:
    """Upload a single file to the user's document library."""
    file_bytes = await file.read()

    # Validate size
    if len(file_bytes) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.max_upload_size_bytes // (1024 * 1024)} MB",
        )

    # Determine source type
    filename = file.filename or "untitled"
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    source_type = EXTENSION_TO_SOURCE_TYPE.get(ext)
    if source_type is None:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Supported: {list(EXTENSION_TO_SOURCE_TYPE.keys())}",
        )

    # Compute content hash
    content_hash = FileStorage.compute_hash(file_bytes)

    # Check for duplicate
    stmt = select(Document).where(
        Document.user_id == UUID(user_id),
        Document.content_hash == content_hash,
    )
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()

    if existing is not None:
        return DocumentResponse(
            document_id=str(existing.id),
            filename=existing.filename,
            source_type=existing.source_type.value,
            content_hash=existing.content_hash,
            page_count=existing.page_count,
            uploaded_at=existing.uploaded_at,
            size_bytes=existing.size_bytes,
            is_duplicate=True,
        )

    # Extract page count for PDFs
    page_count: int | None = None
    if source_type == SourceType.PDF:
        pages = await load_pdf(file_bytes)
        page_count = len(pages)

    # Create document
    doc = Document(
        user_id=UUID(user_id),
        filename=filename,
        source_type=source_type,
        content_hash=content_hash,
        page_count=page_count,
        size_bytes=len(file_bytes),
    )
    db.add(doc)
    await db.flush()

    # Save file
    await storage.save(user_id, str(doc.id), filename, file_bytes)

    return DocumentResponse(
        document_id=str(doc.id),
        filename=doc.filename,
        source_type=doc.source_type.value,
        content_hash=doc.content_hash,
        page_count=doc.page_count,
        uploaded_at=doc.uploaded_at,
        size_bytes=doc.size_bytes,
        is_duplicate=False,
    )


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    user_id: str,
    db: AsyncSession = Depends(get_db),
) -> DocumentListResponse:
    """List all documents owned by a user."""
    corpus_count_subq = (
        select(func.count())
        .select_from(corpus_documents)
        .where(corpus_documents.c.document_id == Document.id)
        .correlate(Document)
        .scalar_subquery()
    )

    stmt = (
        select(Document, corpus_count_subq.label("corpus_count"))
        .where(Document.user_id == UUID(user_id))
        .order_by(Document.uploaded_at.desc())
    )
    result = await db.execute(stmt)
    rows = result.all()

    items = [
        DocumentListItem(
            document_id=str(doc.id),
            filename=doc.filename,
            source_type=doc.source_type.value,
            uploaded_at=doc.uploaded_at,
            page_count=doc.page_count,
            size_bytes=doc.size_bytes,
            corpus_count=count or 0,
        )
        for doc, count in rows
    ]

    return DocumentListResponse(documents=items, total=len(items))
