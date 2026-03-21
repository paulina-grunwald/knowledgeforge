/**
 * Retrieval Playground page - main testing interface for RAG pipeline.
 * Features live query execution, result visualization, and performance metrics.
 */

"use client";

import { useState } from "react";
import { DebugRetrieveRequest, RetrievalResult, debugRetrieve } from "@/lib/api";
import { RetrievalControls } from "@/components/retrieval/RetrievalControls";
import { RetrievedChunksList } from "@/components/retrieval/RetrievedChunksList";
import { QueryExpansionsPanel } from "@/components/retrieval/QueryExpansionsPanel";
import { MetricsPanel } from "@/components/retrieval/MetricsPanel";
import { ParentSectionsPanel } from "@/components/retrieval/ParentSectionsPanel";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { toast } from "sonner";

export default function RetrievalPlaygroundPage() {
  const [result, setResult] = useState<RetrievalResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<string | null>(null);

  const handleRetrieve = async (req: DebugRetrieveRequest) => {
    setLoading(true);
    setError(null);

    try {
      const data = await debugRetrieve(req);
      setResult(data);
      setLastQuery(req.concept_name);

      // Show success toast
      toast.success(
        `Retrieved ${data.chunks.length} chunks in ${data.latency_ms}ms`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Retrieval failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const hasCacheHit = result && result.latency_ms < 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <ErrorBoundary>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Retrieval Playground
            </h1>
            <p className="text-gray-600">
              Test your RAG pipeline with live query execution and performance metrics
            </p>
          </div>

          {/* Main layout: Left sidebar + Center + Right sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left: Controls (1 col) */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <RetrievalControls onRetrieve={handleRetrieve} loading={loading} />
              </div>
            </div>

            {/* Center: Results (2 cols) */}
            <div className="lg:col-span-2">
              {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-700 font-medium">Error: {error}</p>
                </div>
              )}

              <div className="bg-white rounded-lg p-6">
                <RetrievedChunksList
                  chunks={result?.chunks || []}
                  loading={loading}
                />
              </div>
            </div>

            {/* Right: Metrics + Expansions + Parent Sections (1 col) */}
            <div className="lg:col-span-1 space-y-6">
              <div className="sticky top-6 space-y-6">
                {result && (
                  <>
                    <MetricsPanel
                      latencyMs={result.latency_ms}
                      cacheHit={hasCacheHit || false}
                    />

                    <QueryExpansionsPanel
                      originalQuery={lastQuery || ""}
                      expansions={result.query_expansions}
                    />

                    <ParentSectionsPanel sections={result.parent_sections} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
}
