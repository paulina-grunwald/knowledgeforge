"""Types for retrieval pipeline."""

from dataclasses import dataclass
from enum import Enum


class RetrievalMethod(str, Enum):
    """Retrieval method used to find a chunk."""

    SEMANTIC = "semantic"
    LEXICAL = "lexical"
    FUSED = "fused"


@dataclass
class RetrievedChunk:
    """A chunk retrieved and ranked by the retrieval pipeline."""

    chunk_text: str
    concept_id: str
    parent_doc_id: str
    source_page: int | None
    chunk_index: int
    score: float  # final score after reranking (0–1)
    retrieval_method: RetrievalMethod


@dataclass
class RetrievalResult:
    """Result of a retrieval pipeline run."""

    chunks: list[RetrievedChunk]  # top-k after reranking, ordered by score desc
    parent_sections: list[str]  # full parent sections for chunks with score > 0.85
    query_expansions: list[str]  # the generated rephrasings (for logging)
    latency_ms: int
