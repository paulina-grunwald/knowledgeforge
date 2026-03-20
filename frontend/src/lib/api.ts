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
