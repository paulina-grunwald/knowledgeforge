"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DocumentItem } from "@/lib/api";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  documents: DocumentItem[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}

export function DocumentList({ documents, selectedIds, onToggle }: Props) {
  if (documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No documents yet. Upload some files above.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Documents ({documents.length})</CardTitle>
        <p className="text-sm text-muted-foreground">
          Select documents to create a study set
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.document_id}
              onClick={() => onToggle(doc.document_id)}
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedIds.has(doc.document_id)
                  ? "border-brand bg-brand-subtle"
                  : "border-border hover:border-brand/30"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  checked={selectedIds.has(doc.document_id)}
                  onChange={() => onToggle(doc.document_id)}
                  className="shrink-0 accent-[oklch(0.452_0.213_292)] w-4 h-4"
                />
                <div className="min-w-0">
                  <p className="font-medium truncate">{doc.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(doc.size_bytes)}
                    {doc.page_count !== null && ` - ${doc.page_count} pages`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="secondary">{doc.source_type}</Badge>
                {doc.corpus_count > 0 && (
                  <Badge variant="outline">
                    {doc.corpus_count} set{doc.corpus_count !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
