/**
 * Comparison view for A/B testing retrieval strategies.
 * Tests multi-query expansion ON vs OFF.
 */

"use client";

import { useState } from "react";
import { DebugRetrieveRequest, RetrievalResult, debugRetrieve } from "@/lib/api";
import { RetrievalControls } from "@/components/retrieval/RetrievalControls";
import { RetrievedChunksList } from "@/components/retrieval/RetrievedChunksList";
import { MetricsPanel } from "@/components/retrieval/MetricsPanel";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function ComparisonPage() {
  const [leftResult, setLeftResult] = useState<RetrievalResult | null>(null);
  const [rightResult, setRightResult] = useState<RetrievalResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRetrieve = async (req: DebugRetrieveRequest) => {
    setLoading(true);

    try {
      // Right: Multi-query expansion ON (default)
      const right = await debugRetrieve(req);
      setRightResult(right);

      // TODO: Left would be without expansion (needs API flag)
      // For now, just show right side
      setLeftResult(null);

      toast.success("Retrieved results for comparison");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Retrieval failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getOverlap = (): number => {
    if (!leftResult || !rightResult) return 0;

    const leftIds = new Set(
      leftResult.chunks.map((c) => `${c.parent_doc_id}:${c.chunk_index}`)
    );
    const rightIds = new Set(
      rightResult.chunks.map((c) => `${c.parent_doc_id}:${c.chunk_index}`)
    );

    let overlap = 0;
    leftIds.forEach((id) => {
      if (rightIds.has(id)) overlap++;
    });

    return overlap;
  };

  const overlap = getOverlap();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <ErrorBoundary>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Retrieval Comparison
            </h1>
            <p className="text-gray-600">
              A/B test retrieval strategies: multi-query expansion ON vs OFF
            </p>
          </div>

          {/* Controls */}
          <div className="mb-6 max-w-md">
            <RetrievalControls onRetrieve={handleRetrieve} loading={loading} />
          </div>

          {/* Comparison grid */}
          {(leftResult || rightResult) && (
            <div className="space-y-6">
              {/* Overlap stats */}
              <Card className="p-6 bg-white">
                <h3 className="font-semibold text-lg mb-4">Comparison Stats</h3>
                <div className="grid grid-cols-4 gap-4">
                  {leftResult && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {leftResult.chunks.length}
                      </p>
                      <p className="text-sm text-gray-600">Left Results</p>
                    </div>
                  )}
                  {rightResult && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {rightResult.chunks.length}
                      </p>
                      <p className="text-sm text-gray-600">Right Results</p>
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {overlap}
                    </p>
                    <p className="text-sm text-gray-600">Overlap</p>
                  </div>
                  {leftResult && rightResult && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        {leftResult.chunks.length + rightResult.chunks.length - overlap * 2}
                      </p>
                      <p className="text-sm text-gray-600">Unique Chunks</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Side-by-side results */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Without expansion (placeholder) */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold">Multi-query OFF</h3>
                    <Badge variant="outline" className="bg-blue-50">
                      Baseline
                    </Badge>
                  </div>
                  <Card className="p-6 bg-white">
                    <p className="text-sm text-gray-500">
                      Requires API support for expansion=false parameter.
                      Coming in next iteration.
                    </p>
                  </Card>
                </div>

                {/* Right: With expansion */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold">Multi-query ON</h3>
                    <Badge variant="outline" className="bg-purple-50">
                      Current
                    </Badge>
                  </div>
                  <div className="space-y-4">
                    {rightResult && (
                      <>
                        <MetricsPanel
                          latencyMs={rightResult.latency_ms}
                          cacheHit={rightResult.latency_ms < 100}
                        />
                        <RetrievedChunksList
                          chunks={rightResult.chunks}
                          loading={false}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ErrorBoundary>
    </div>
  );
}
