const API_BASE = "http://localhost:8000";

// Hardcoded user for Phase 1 — no auth yet
export const USER_ID = "00000000-0000-4000-8000-000000000001";

// ---------- Types ----------

export interface DocumentItem {
  document_id: string;
  filename: string;
  source_type: string;
  uploaded_at: string;
  page_count: number | null;
  size_bytes: number;
  corpus_count: number;
}

export interface UploadResult {
  document_id: string;
  filename: string;
  source_type: string;
  content_hash: string;
  page_count: number | null;
  uploaded_at: string;
  size_bytes: number;
  is_duplicate: boolean;
}

export interface CorpusListItem {
  corpus_id: string;
  name: string;
  status: string;
  document_count: number;
  chunk_count: number;
  concept_count: number;
  created_at: string;
  ingested_at: string | null;
}

export interface CorpusDetail {
  corpus_id: string;
  name: string;
  status: string;
  chunk_count: number;
  concept_count: number;
  document_count: number;
  documents: { document_id: string; filename: string; source_type: string }[];
  ingested_at: string | null;
  created_at: string;
}

// ---------- Phase 2: Retrieval ----------

export type RetrievalMethod = "semantic" | "lexical" | "fused";

export interface RetrievedChunk {
  chunk_text: string;
  concept_id: string;
  parent_doc_id: string;
  source_page: number | null;
  chunk_index: number;
  score: number;
  retrieval_method: RetrievalMethod;
}

export interface RetrievalResult {
  chunks: RetrievedChunk[];
  parent_sections: string[];
  query_expansions: string[];
  latency_ms: number;
}

export interface ConceptItem {
  concept_id: string;
  name: string;
  definition: string;
  prerequisites: string[];
}

export interface DebugRetrieveRequest {
  corpus_id: string;
  concept_name: string;
  concept_id?: string;
  top_n?: number;
}

// ---------- Documents ----------

export async function uploadDocument(file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append("user_id", USER_ID);
  form.append("file", file);

  const res = await fetch(`${API_BASE}/documents`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Upload failed");
  }

  return res.json();
}

export async function listDocuments(): Promise<DocumentItem[]> {
  const res = await fetch(
    `${API_BASE}/documents?user_id=${USER_ID}`
  );
  if (!res.ok) throw new Error("Failed to list documents");
  const data = await res.json();
  return data.documents;
}

// ---------- Corpora (Study Sets) ----------

export async function createCorpus(
  name: string,
  documentIds: string[]
): Promise<{ corpus_id: string; status: string }> {
  const res = await fetch(`${API_BASE}/corpora`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: USER_ID,
      name,
      document_ids: documentIds,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Failed to create study set");
  }

  return res.json();
}

export async function listCorpora(): Promise<CorpusListItem[]> {
  const res = await fetch(
    `${API_BASE}/corpora?user_id=${USER_ID}`
  );
  if (!res.ok) throw new Error("Failed to list corpora");
  const data = await res.json();
  return data.corpora;
}

export async function getCorpusStatus(
  corpusId: string
): Promise<CorpusDetail> {
  const res = await fetch(`${API_BASE}/corpora/${corpusId}`);
  if (!res.ok) throw new Error("Failed to get corpus status");
  return res.json();
}

export async function addDocumentsToCorpus(
  corpusId: string,
  documentIds: string[]
): Promise<{ corpus_id: string; status: string; message: string; document_count: number }> {
  const res = await fetch(`${API_BASE}/corpora/${corpusId}/documents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: USER_ID,
      document_ids: documentIds,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Failed to add documents");
  }

  return res.json();
}

export async function deleteCorpus(corpusId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/corpora/${corpusId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Failed to delete study set");
  }
}

// ---------- Retrieval (Phase 2) ----------

export async function debugRetrieve(
  req: DebugRetrieveRequest
): Promise<RetrievalResult> {
  const body: Record<string, unknown> = {
    corpus_id: req.corpus_id,
    concept_name: req.concept_name,
  };

  if (req.concept_id) {
    body.concept_id = req.concept_id;
  }
  if (req.top_n !== undefined) {
    body.top_n = req.top_n;
  }

  const res = await fetch(`${API_BASE}/debug/retrieve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Retrieval failed");
  }

  return res.json();
}

export async function listConcepts(corpusId: string): Promise<ConceptItem[]> {
  const res = await fetch(`${API_BASE}/corpora/${corpusId}/concepts`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Failed to list concepts");
  }

  const data = await res.json();
  return data.concepts || [];
}

export async function getConcept(conceptId: string): Promise<ConceptItem> {
  const res = await fetch(`${API_BASE}/concepts/${conceptId}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Failed to get concept");
  }

  return res.json();
}

export async function getCorpusByName(
  name: string
): Promise<CorpusDetail | null> {
  try {
    const corpora = await listCorpora();
    const corpus = corpora.find(
      (c) => c.name.toLowerCase() === name.toLowerCase()
    );
    if (!corpus) return null;
    return getCorpusStatus(corpus.corpus_id);
  } catch {
    return null;
  }
}

export async function getDocumentsForCorpus(
  corpusId: string
): Promise<{ document_id: string; filename: string; source_type: string }[]> {
  const res = await fetch(`${API_BASE}/corpora/${corpusId}`);
  if (!res.ok) throw new Error("Failed to fetch corpus documents");
  const corpus = await res.json();
  return corpus.documents || [];
}

export async function getDocumentContent(
  documentId: string
): Promise<Blob> {
  const res = await fetch(
    `${API_BASE}/documents/${documentId}/content?user_id=${USER_ID}`
  );
  if (!res.ok) throw new Error("Failed to fetch document content");
  return res.blob();
}
