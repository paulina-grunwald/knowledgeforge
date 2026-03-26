"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { addDocumentsToCorpus, deleteCorpus, type CorpusListItem } from "@/lib/api";

function statusClassName(status: string) {
  switch (status) {
    case "ready":
      return "bg-green-50 text-green-700 border border-green-200";
    case "processing":
    case "pending":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "failed":
      return "bg-red-50 text-red-700 border border-red-200";
    default:
      return "bg-muted text-muted-foreground border border-border";
  }
}

interface Props {
  corpora: CorpusListItem[];
  selectedDocIds: Set<string>;
  onRefresh: () => void;
}

export function StudySetList({ corpora, selectedDocIds, onRefresh }: Props) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);

  // Auto-refresh while any corpus is processing
  const hasProcessing = corpora.some(
    (c) => c.status === "processing" || c.status === "pending"
  );
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    if (hasProcessing) {
      intervalRef.current = setInterval(onRefresh, 3000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hasProcessing, onRefresh]);

  const handleDelete = async (corpusId: string, name: string) => {
    if (!confirm(`Delete study set "${name}"? This cannot be undone.`)) return;
    setDeleting(corpusId);
    try {
      await deleteCorpus(corpusId);
      onRefresh();
    } catch {
      alert("Failed to delete study set");
    } finally {
      setDeleting(null);
    }
  };

  const handleAddDocs = async (corpusId: string) => {
    setAdding(corpusId);
    try {
      await addDocumentsToCorpus(corpusId, Array.from(selectedDocIds));
      onRefresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to add documents");
    } finally {
      setAdding(null);
    }
  };

  if (corpora.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Study Sets</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No study sets yet. Upload documents and create one above.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Study Sets ({corpora.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {corpora.map((c) => (
            <div
              key={c.corpus_id}
              className="p-4 rounded-lg border border-border hover:border-brand-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{c.name}</h3>
                <div className="flex items-center gap-2">
                  <Badge className={statusClassName(c.status)}>{c.status}</Badge>
                  {selectedDocIds.size > 0 && c.status === "ready" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => handleAddDocs(c.corpus_id)}
                      disabled={adding === c.corpus_id}
                    >
                      {adding === c.corpus_id ? "Adding..." : `+ Add ${selectedDocIds.size} doc(s)`}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2"
                    onClick={() => handleDelete(c.corpus_id, c.name)}
                    disabled={deleting === c.corpus_id}
                  >
                    {deleting === c.corpus_id ? "..." : "Delete"}
                  </Button>
                </div>
              </div>

              {(c.status === "processing" || c.status === "pending") && (
                <Progress value={c.status === "pending" ? 10 : 50} className="mb-2 h-1.5" />
              )}

              <div className="flex gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted rounded-md px-2 py-0.5">
                  {c.document_count} docs
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted rounded-md px-2 py-0.5">
                  {c.chunk_count} chunks
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted rounded-md px-2 py-0.5">
                  {c.concept_count} concepts
                </span>
              </div>

              {c.ingested_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  Ingested {new Date(c.ingested_at).toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
