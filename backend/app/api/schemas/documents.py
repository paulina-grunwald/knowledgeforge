from datetime import datetime

from pydantic import BaseModel


class DocumentResponse(BaseModel):
    document_id: str
    filename: str
    source_type: str
    content_hash: str
    page_count: int | None
    uploaded_at: datetime
    size_bytes: int
    is_duplicate: bool


class DocumentListItem(BaseModel):
    document_id: str
    filename: str
    source_type: str
    uploaded_at: datetime
    page_count: int | None
    size_bytes: int
    corpus_count: int


class DocumentListResponse(BaseModel):
    documents: list[DocumentListItem]
    total: int
