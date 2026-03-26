/**
 * Display list of retrieved chunks with scores, metadata, and expand functionality.
 */

"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RetrievedChunk } from "@/lib/api";
import { LoadingSkeleton, EmptyState } from "@/components/shared";
import {
  getScoreColor,
  getScoreTextColor,
  getMethodColor,
  getMethodTextColor,
} from "@/lib/utils/colors";
import { formatScore, truncate } from "@/lib/utils/formatting";
import { ChevronDown, ChevronUp, Copy } from "lucide-react";

interface RetrievedChunksListProps {
  chunks: RetrievedChunk[];
  loading: boolean;
}

export function RetrievedChunksList({ chunks, loading }: RetrievedChunksListProps) {
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (loading) {
    return <LoadingSkeleton type="list" count={5} />;
  }

  if (chunks.length === 0) {
    return (
      <EmptyState
        icon={() => (
          <div className="text-2xl">📚</div>
        )}
        title="No Results Yet"
        description="Enter a concept name and click Retrieve to see chunks"
      />
    );
  }

  const sorted = [...chunks].sort((a, b) => {
    return sortOrder === "desc" ? b.score - a.score : a.score - b.score;
  });

  const toggleSort = () => {
    setSortOrder(sortOrder === "desc" ? "asc" : "desc");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">{chunks.length} Results</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSort}
          className="gap-2"
        >
          {sortOrder === "desc" ? (
            <>
              <ChevronDown className="w-4 h-4" />
              Highest First
            </>
          ) : (
            <>
              <ChevronUp className="w-4 h-4" />
              Lowest First
            </>
          )}
        </Button>
      </div>

      {sorted.map((chunk, index) => (
        <Card key={index} className="p-4 hover:shadow-md transition-shadow">
          <div className="space-y-3">
            {/* Header row with score and method */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-2">
                <Badge
                  className={`${getScoreColor(chunk.score)} ${getScoreTextColor(chunk.score)}`}
                >
                  {formatScore(chunk.score)}
                </Badge>
                <Badge
                  className={`${getMethodColor(chunk.retrieval_method)} ${getMethodTextColor(chunk.retrieval_method)}`}
                >
                  {chunk.retrieval_method}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setExpandedIndex(expandedIndex === index ? null : index)
                }
              >
                {expandedIndex === index ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Chunk text (truncated or full) */}
            <div className="space-y-2">
              <div className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none">
                <ReactMarkdown>
                  {expandedIndex === index
                    ? chunk.chunk_text
                    : truncate(chunk.chunk_text, 200)}
                </ReactMarkdown>
              </div>
            </div>

            {/* Metadata row */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
              <span>Doc: {truncate(chunk.parent_doc_id, 20)}</span>
              <span>Chunk #{chunk.chunk_index}</span>
              {chunk.source_page !== null && (
                <span>Page {chunk.source_page}</span>
              )}
              {chunk.concept_id && (
                <span>Concept: {truncate(chunk.concept_id, 16)}</span>
              )}
            </div>

            {/* Copy button (visible when expanded) */}
            {expandedIndex === index && (
              <div className="pt-2 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(chunk.chunk_text)}
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy Text
                </Button>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
