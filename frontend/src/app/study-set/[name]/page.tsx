/**
 * Study Set Documents Page - View all documents in a study set
 */

"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import {
  getCorpusByName,
  getDocumentsForCorpus,
  CorpusDetail,
} from "@/lib/api";
import { ChevronRight, Home, File, FileText, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorBoundary } from "@/components/shared";
import { DocumentViewer } from "@/components/document-viewer";

interface StudySetPageProps {
  params: {
    name: string;
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(sourceType: string) {
  switch (sourceType.toLowerCase()) {
    case "pdf":
      return <FileText className="w-5 h-5 text-red-500" />;
    case "txt":
      return <File className="w-5 h-5 text-gray-500" />;
    case "notion":
      return <File className="w-5 h-5 text-blue-500" />;
    default:
      return <File className="w-5 h-5 text-gray-500" />;
  }
}

export default function StudySetPage({ params }: StudySetPageProps) {
  const { name } = use(params);
  const router = useRouter();
  const decodedName = decodeURIComponent(name);

  const [corpus, setCorpus] = useState<CorpusDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<{
    document_id: string;
    filename: string;
    source_type: string;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const corpusData = await getCorpusByName(decodedName);
        if (!corpusData) {
          setError(`Study set "${decodedName}" not found`);
        } else {
          setCorpus(corpusData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load study set");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [decodedName]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">Loading study set...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !corpus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <EmptyState
            icon={() => <div className="text-4xl">📚</div>}
            title="Study Set Not Found"
            description={error || "The requested study set could not be found."}
            action={{ label: "Go Back", onClick: () => router.back() }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <ErrorBoundary>
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-8">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-1 hover:text-gray-900 transition"
            >
              <Home className="w-4 h-4" />
              Library
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-400">{corpus.name}</span>
            <ChevronRight className="w-4 h-4" />
            <span className="font-medium text-gray-900">Documents</span>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Documents List */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">{corpus.name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-2">
                    {corpus.document_count} document
                    {corpus.document_count !== 1 ? "s" : ""}
                  </p>
                </CardHeader>
                <CardContent>
                  {corpus.documents.length === 0 ? (
                    <EmptyState
                      icon={() => <File className="w-8 h-8 text-gray-400" />}
                      title="No documents"
                      description="This study set doesn't have any documents yet."
                    />
                  ) : (
                    <div className="space-y-3">
                      {corpus.documents.map((doc) => (
                        <button
                          key={doc.document_id}
                          onClick={() => setSelectedDoc(doc)}
                          className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                            selectedDoc?.document_id === doc.document_id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-blue-300 bg-white hover:bg-gray-50"
                          }`}
                        >
                          <div className="shrink-0">
                            {getFileIcon(doc.source_type)}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {doc.filename}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {doc.source_type.toUpperCase()}
                            </p>
                          </div>
                          <Badge variant="outline" className="shrink-0">
                            {doc.source_type}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Document Viewer or Study Set Info */}
            {selectedDoc ? (
              <DocumentViewer
                documentId={selectedDoc.document_id}
                filename={selectedDoc.filename}
                sourceType={selectedDoc.source_type}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Study Set Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                      Status
                    </p>
                    <Badge
                      variant={
                        corpus.status === "ready" ? "default" : "secondary"
                      }
                    >
                      {corpus.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Documents</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {corpus.document_count}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Concepts</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {corpus.concept_count}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Chunks</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {corpus.chunk_count}
                      </p>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() =>
                      router.push(`/study-sets/${corpus.corpus_id}/concepts`)
                    }
                  >
                    View Concepts
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
}
