/**
 * Right sidebar with quick stats, actions, and corpus info.
 */

"use client";

import { CorpusDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Zap, Calendar } from "lucide-react";

interface ConceptStats {
  totalConcepts: number;
  withPrerequisites: number;
  foundational: number;
  avgPrerequisites: number;
  maxPrerequisiteDepth: number;
}

interface ConceptQuickActionsProps {
  corpus: CorpusDetail;
  stats: ConceptStats;
  conceptCount: number;
}

export function ConceptQuickActions({
  corpus,
  stats,
  conceptCount,
}: ConceptQuickActionsProps) {
  const handleExport = () => {
    // For now, just a placeholder. Real implementation would use Papa Parse or similar
    alert("Export functionality coming soon! You'll be able to download as JSON or CSV.");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not ingested yet";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-lg text-gray-900">Quick Stats</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Avg Prerequisites/Concept</span>
            <span className="font-medium text-gray-900">
              {stats.avgPrerequisites.toFixed(1)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Max Prerequisite Depth</span>
            <span className="font-medium text-gray-900">{stats.maxPrerequisiteDepth}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Ready to Study</span>
            <span className="font-medium text-green-600">{stats.foundational}</span>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-6 space-y-3">
        <h3 className="font-semibold text-lg text-gray-900">Actions</h3>
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleExport}
          >
            <Download className="w-4 h-4" />
            Export Concepts
          </Button>
        </div>
      </Card>

      {/* Corpus Info */}
      <Card className="p-6 space-y-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
        <h3 className="font-semibold text-lg text-gray-900">Study Set Info</h3>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-gray-600 mb-1">Name</p>
            <p className="font-medium text-gray-900">{corpus.name}</p>
          </div>
          <div>
            <p className="text-gray-600 mb-1">Documents</p>
            <p className="font-medium text-gray-900">{corpus.document_count}</p>
          </div>
          <div>
            <p className="text-gray-600 mb-1">Chunks</p>
            <p className="font-medium text-gray-900">{corpus.chunk_count}</p>
          </div>
          <div>
            <p className="text-gray-600 mb-1">Concepts</p>
            <p className="font-medium text-gray-900">{conceptCount}</p>
          </div>
          <div className="pt-2 border-t border-purple-200">
            <p className="text-gray-600 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Last Ingested
            </p>
            <p className="font-medium text-gray-900 text-xs">
              {formatDate(corpus.ingested_at)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
