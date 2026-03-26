/**
 * Document Viewer Component
 * Handles viewing different file types (PDF, text, etc.)
 */

"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { getDocumentContent } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2, AlertCircle } from "lucide-react";

interface DocumentViewerProps {
  documentId: string;
  filename: string;
  sourceType: string;
}

export function DocumentViewer({
  documentId,
  filename,
  sourceType,
}: DocumentViewerProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);

  useEffect(() => {
    const loadDocument = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getDocumentContent(documentId);
        setBlob(data);

        // For text files, try to extract text content
        if (sourceType.toLowerCase() === "txt" || sourceType.toLowerCase() === "text") {
          try {
            const text = await data.text();
            setContent(text);
          } catch {
            setContent(null);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load document");
        setContent(null);
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [documentId, sourceType]);

  const handleDownload = () => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
            <p className="text-gray-600">Loading document...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full border-red-200">
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={handleDownload} disabled={!blob} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download File
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg truncate">{filename}</CardTitle>
          <Button
            onClick={handleDownload}
            disabled={!blob}
            size="sm"
            variant="outline"
            className="gap-2 shrink-0"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto">
        {content ? (
          <div className="prose prose-sm max-w-none dark:prose-invert p-4">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : sourceType.toLowerCase() === "pdf" ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-4">📄</div>
            <p className="text-gray-600 mb-4">PDF Preview</p>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">
              Click the download button to view the full PDF document
            </p>
            <Button onClick={handleDownload} disabled={!blob} className="gap-2">
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-4">📄</div>
            <p className="text-gray-600">Document Ready</p>
            <p className="text-sm text-gray-500 mt-2">
              Click the download button to view the document
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
