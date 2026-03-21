from datetime import datetime

from pydantic import BaseModel, field_validator


def _validate_non_empty_list(v: list[str]) -> list[str]:
    """Validator for document_ids - must contain at least one ID."""
    if not v:
        raise ValueError("At least one document_id is required")
    return v


class CreateCorpusRequest(BaseModel):
    user_id: str
    name: str
    document_ids: list[str]

    @field_validator("document_ids")
    @classmethod
    def validate_documents(cls, v: list[str]) -> list[str]:
        return _validate_non_empty_list(v)


class CreateCorpusResponse(BaseModel):
    corpus_id: str
    status: str
    message: str
    document_count: int


class CorpusDocumentItem(BaseModel):
    document_id: str
    filename: str
    source_type: str


class CorpusStatusResponse(BaseModel):
    corpus_id: str
    name: str
    status: str
    chunk_count: int
    concept_count: int
    document_count: int
    documents: list[CorpusDocumentItem]
    ingested_at: datetime | None
    created_at: datetime


class AddDocumentsRequest(BaseModel):
    user_id: str
    document_ids: list[str]

    @field_validator("document_ids")
    @classmethod
    def validate_documents(cls, v: list[str]) -> list[str]:
        return _validate_non_empty_list(v)


class AddDocumentsResponse(BaseModel):
    corpus_id: str
    status: str
    message: str
    document_count: int


class CorpusListItem(BaseModel):
    corpus_id: str
    name: str
    status: str
    document_count: int
    chunk_count: int
    concept_count: int
    created_at: datetime
    ingested_at: datetime | None


class CorpusListResponse(BaseModel):
    corpora: list[CorpusListItem]
    total: int


class ConceptItem(BaseModel):
    concept_id: str
    name: str
    definition: str
    prerequisites: list[str]


class ConceptsResponse(BaseModel):
    corpus_id: str
    concepts: list[ConceptItem]
    total: int
