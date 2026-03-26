/**
 * Page header with breadcrumbs and title.
 */

"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, Home, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConceptsPageHeaderProps {
  corpusName: string;
  conceptCount: number;
}

export function ConceptsPageHeader({
  corpusName,
  conceptCount,
}: ConceptsPageHeaderProps) {
  const router = useRouter();

  return (
    <div className="mb-8">
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1 hover:text-gray-900 transition"
          >
            <Home className="w-4 h-4" />
            Library
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-400">{corpusName}</span>
          <ChevronRight className="w-4 h-4" />
          <span className="font-medium text-gray-900">Concepts</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            router.push(`/study-set/${encodeURIComponent(corpusName)}`)
          }
          className="gap-2"
        >
          <FileText className="w-4 h-4" />
          View Documents
        </Button>
      </div>

      {/* Title and Description */}
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Concepts ({conceptCount})
      </h1>
      <p className="text-gray-600">
        Explore the {conceptCount} concepts extracted from "{corpusName}"
      </p>
    </div>
  );
}
