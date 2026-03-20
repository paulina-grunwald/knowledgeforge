import enum
from datetime import datetime
from uuid import uuid4

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSON, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class SourceType(str, enum.Enum):
    PDF = "pdf"
    NOTION = "notion"
    TEXT = "text"


class CorpusStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class KnowledgeStateEnum(str, enum.Enum):
    UNSEEN = "UNSEEN"
    EXPOSED = "EXPOSED"
    SHAKY = "SHAKY"
    SOLID = "SOLID"
    STALE = "STALE"


class SessionType(str, enum.Enum):
    STUDY = "study"
    EXAM = "exam"
    TEACH_BACK = "teach_back"


class QuestionType(str, enum.Enum):
    RECALL = "recall"
    APPLICATION = "application"
    BRIDGE = "bridge"
    ELABORATION = "elaboration"
    TEACH_BACK = "teach_back"
    PRETEST = "pretest"


corpus_documents = Table(
    "corpus_documents",
    Base.metadata,
    Column(
        "corpus_id",
        UUID(as_uuid=True),
        ForeignKey("corpora.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "document_id",
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "added_at",
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    ),
)


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid4] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    documents: Mapped[list["Document"]] = relationship(back_populates="user")
    corpora: Mapped[list["Corpus"]] = relationship(back_populates="user")
    knowledge_states: Mapped[list["KnowledgeState"]] = relationship(back_populates="user")
    sessions: Mapped[list["Session"]] = relationship(back_populates="user")


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid4] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[uuid4] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    filename: Mapped[str] = mapped_column(String(512), nullable=False)
    source_type: Mapped[SourceType] = mapped_column(nullable=False)
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    page_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)

    user: Mapped["User"] = relationship(back_populates="documents")
    corpora: Mapped[list["Corpus"]] = relationship(
        secondary=corpus_documents, back_populates="documents"
    )


class Corpus(Base):
    __tablename__ = "corpora"

    id: Mapped[uuid4] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[uuid4] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[CorpusStatus] = mapped_column(
        default=CorpusStatus.PENDING, nullable=False
    )
    chunk_count: Mapped[int] = mapped_column(Integer, default=0)
    ingested_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="corpora")
    documents: Mapped[list["Document"]] = relationship(
        secondary=corpus_documents, back_populates="corpora"
    )
    concepts: Mapped[list["Concept"]] = relationship(
        back_populates="corpus", cascade="all, delete-orphan"
    )
    sessions: Mapped[list["Session"]] = relationship(back_populates="corpus")


class Concept(Base):
    __tablename__ = "concepts"

    id: Mapped[uuid4] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    corpus_id: Mapped[uuid4] = mapped_column(
        UUID(as_uuid=True), ForeignKey("corpora.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    definition: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[list[float] | None] = mapped_column(
        ARRAY(Float), nullable=True
    )
    prerequisites: Mapped[list[uuid4] | None] = mapped_column(
        ARRAY(UUID(as_uuid=True)), default=list
    )

    corpus: Mapped["Corpus"] = relationship(back_populates="concepts")
    knowledge_states: Mapped[list["KnowledgeState"]] = relationship(back_populates="concept")
    responses: Mapped[list["Response"]] = relationship(back_populates="concept")


class KnowledgeState(Base):
    __tablename__ = "knowledge_states"
    __table_args__ = (
        UniqueConstraint("user_id", "concept_id", name="uq_user_concept"),
    )

    id: Mapped[uuid4] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[uuid4] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    concept_id: Mapped[uuid4] = mapped_column(
        UUID(as_uuid=True), ForeignKey("concepts.id"), nullable=False, index=True
    )
    state: Mapped[KnowledgeStateEnum] = mapped_column(
        default=KnowledgeStateEnum.UNSEEN, nullable=False
    )
    difficulty: Mapped[float] = mapped_column(Float, default=5.0)
    stability: Mapped[float] = mapped_column(Float, default=1.0)
    retrievability: Mapped[float] = mapped_column(Float, default=1.0)
    last_reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    next_review_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    correct_count: Mapped[int] = mapped_column(Integer, default=0)
    attempt_count: Mapped[int] = mapped_column(Integer, default=0)
    high_conf_error_count: Mapped[int] = mapped_column(Integer, default=0)
    flags: Mapped[dict] = mapped_column(JSON, default=dict)

    user: Mapped["User"] = relationship(back_populates="knowledge_states")
    concept: Mapped["Concept"] = relationship(back_populates="knowledge_states")


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[uuid4] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[uuid4] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    corpus_id: Mapped[uuid4] = mapped_column(
        UUID(as_uuid=True), ForeignKey("corpora.id"), nullable=False, index=True
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    ended_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    session_type: Mapped[SessionType] = mapped_column(
        default=SessionType.STUDY, nullable=False
    )
    langgraph_state: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    user: Mapped["User"] = relationship(back_populates="sessions")
    corpus: Mapped["Corpus"] = relationship(back_populates="sessions")
    responses: Mapped[list["Response"]] = relationship(back_populates="session")


class Response(Base):
    __tablename__ = "responses"

    id: Mapped[uuid4] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    session_id: Mapped[uuid4] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False, index=True
    )
    concept_id: Mapped[uuid4] = mapped_column(
        UUID(as_uuid=True), ForeignKey("concepts.id"), nullable=False, index=True
    )
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[QuestionType] = mapped_column(nullable=False)
    answer_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    confidence: Mapped[int | None] = mapped_column(Integer, nullable=True)
    correct: Mapped[bool | None] = mapped_column(nullable=True)
    hint_level_used: Mapped[int] = mapped_column(Integer, default=0)
    evaluated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, default=dict)

    session: Mapped["Session"] = relationship(back_populates="responses")
    concept: Mapped["Concept"] = relationship(back_populates="responses")
