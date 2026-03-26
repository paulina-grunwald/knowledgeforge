"use client";

import { useCallback, useEffect, useState } from "react";
import { DocumentUpload } from "@/components/document-upload";
import { DocumentList } from "@/components/document-list";
import { CreateStudySet } from "@/components/create-study-set";
import { StudySetList } from "@/components/study-set-list";
import {
  listDocuments,
  listCorpora,
  type DocumentItem,
  type CorpusListItem,
} from "@/lib/api";

export default function LibraryPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [corpora, setCorpora] = useState<CorpusListItem[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());

  const refreshDocs = useCallback(async () => {
    try {
      const docs = await listDocuments();
      setDocuments(docs);
    } catch {
      // backend not running yet
    }
  }, []);

  const refreshCorpora = useCallback(async () => {
    try {
      const list = await listCorpora();
      setCorpora(list);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    refreshDocs();
    refreshCorpora();
  }, [refreshDocs, refreshCorpora]);

  const toggleDoc = (id: string) => {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStudySetCreated = () => {
    setSelectedDocIds(new Set());
    refreshCorpora();
    refreshDocs();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Your Library</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload study materials and create study sets for adaptive learning.
        </p>
      </div>

      <DocumentUpload onUploaded={refreshDocs} />

      <DocumentList
        documents={documents}
        selectedIds={selectedDocIds}
        onToggle={toggleDoc}
      />

      {selectedDocIds.size > 0 && (
        <CreateStudySet
          selectedDocIds={selectedDocIds}
          onCreated={handleStudySetCreated}
        />
      )}

      <StudySetList
        corpora={corpora}
        selectedDocIds={selectedDocIds}
        onRefresh={refreshCorpora}
      />
    </div>
  );
}
