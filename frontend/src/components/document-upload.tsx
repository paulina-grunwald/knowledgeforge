"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { uploadDocument, type UploadResult } from "@/lib/api";

interface Props {
  onUploaded: () => void;
}

export function DocumentUpload({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<
    { file: string; ok: boolean; msg: string }[]
  >([]);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setUploading(true);
      const newResults: { file: string; ok: boolean; msg: string }[] = [];

      for (const file of Array.from(files)) {
        try {
          const result: UploadResult = await uploadDocument(file);
          newResults.push({
            file: file.name,
            ok: true,
            msg: result.is_duplicate ? "Duplicate (skipped)" : "Uploaded",
          });
        } catch (err) {
          newResults.push({
            file: file.name,
            ok: false,
            msg: err instanceof Error ? err.message : "Failed",
          });
        }
      }

      setResults(newResults);
      setUploading(false);
      onUploaded();
    },
    [onUploaded]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.txt,.md"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {uploading ? (
            <p className="text-muted-foreground">Uploading...</p>
          ) : (
            <>
              <p className="font-medium">
                Drop files here or click to browse
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                PDF, TXT, or MD files (max 50 MB each)
              </p>
            </>
          )}
        </div>

        {results.length > 0 && (
          <div className="mt-4 space-y-1">
            {results.map((r, i) => (
              <div
                key={i}
                className={`text-sm flex justify-between ${
                  r.ok ? "text-green-600" : "text-destructive"
                }`}
              >
                <span className="truncate mr-2">{r.file}</span>
                <span className="shrink-0">{r.msg}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
