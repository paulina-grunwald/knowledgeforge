/**
 * Display retrieved chunks as context for current chat question.
 */

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RetrievedChunk } from "@/lib/api";
import { EmptyState } from "@/components/shared";
import { formatScore, truncate } from "@/lib/utils/formatting";
import {
  getScoreColor,
  getScoreTextColor,
  getMethodColor,
  getMethodTextColor,
} from "@/lib/utils/colors";
import { Zap } from "lucide-react";

interface ContextPanelProps {
  chunks: RetrievedChunk[] | null;
  loading?: boolean;
}

export function ContextPanel({ chunks, loading }: ContextPanelProps) {
  if (!chunks) {
    return (
      <Card className="p-6">
        <EmptyState
          icon={Zap}
          title="No Context Yet"
          description="Start chatting to see relevant retrieved chunks here"
        />
      </Card>
    );
  }

  if (chunks.length === 0) {
    return (
      <Card className="p-6">
        <EmptyState
          icon={Zap}
          title="No Relevant Chunks"
          description="No high-scoring chunks found for the current question"
        />
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Context ({chunks.length})</h3>
        {loading && <span className="text-xs text-gray-500">Loading...</span>}
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {chunks.map((chunk, idx) => (
          <div
            key={idx}
            className="p-3 rounded-lg bg-gray-50 border border-gray-200 hover:border-gray-300 transition"
          >
            {/* Score and method badges */}
            <div className="flex gap-2 mb-2">
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

            {/* Chunk text (truncated) */}
            <p className="text-xs text-gray-700 leading-relaxed">
              {truncate(chunk.chunk_text, 150)}
            </p>

            {/* Metadata */}
            <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
              Doc: {truncate(chunk.parent_doc_id, 16)}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
