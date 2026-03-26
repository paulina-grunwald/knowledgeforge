/**
 * Browse and explore concepts extracted from a corpus.
 * Includes table view with filtering and test retrieval actions.
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { ConceptItem, listConcepts } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton, EmptyState } from "@/components/shared";
import { useDebounce } from "@/hooks";
import { truncate } from "@/lib/utils/formatting";
import { Search, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface ConceptExplorerProps {
  corpusId: string;
}

export function ConceptExplorer({ corpusId }: ConceptExplorerProps) {
  const router = useRouter();
  const [concepts, setConcepts] = useState<ConceptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Load concepts on mount
  useEffect(() => {
    const loadConcepts = async () => {
      try {
        setLoading(true);
        const data = await listConcepts(corpusId);
        setConcepts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load concepts");
      } finally {
        setLoading(false);
      }
    };

    loadConcepts();
  }, [corpusId]);

  // Filter concepts by search query
  const filteredConcepts = useMemo(() => {
    if (!debouncedSearch) return concepts;

    const query = debouncedSearch.toLowerCase();
    return concepts.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.definition.toLowerCase().includes(query)
    );
  }, [concepts, debouncedSearch]);

  const handleTestRetrieval = (concept: ConceptItem) => {
    const params = new URLSearchParams({
      corpus_id: corpusId,
      concept: concept.name,
    });
    router.push(`/retrieval?${params.toString()}`);
  };

  if (loading) {
    return <LoadingSkeleton type="list" count={5} />;
  }

  if (error) {
    return (
      <EmptyState
        icon={() => <div className="text-2xl">⚠️</div>}
        title="Error Loading Concepts"
        description={error}
      />
    );
  }

  if (concepts.length === 0) {
    return (
      <EmptyState
        icon={() => <div className="text-2xl">🎓</div>}
        title="No Concepts Found"
        description="This corpus has no extracted concepts. Try ingesting a corpus first."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search concepts by name or definition..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600">
        Showing {filteredConcepts.length} of {concepts.length} concepts
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700">
                Name
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">
                Definition
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">
                Prerequisites
              </th>
              <th className="px-4 py-3 text-center font-medium text-gray-700">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredConcepts.map((concept) => (
              <tr key={concept.concept_id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {concept.name}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {truncate(concept.definition, 80)}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {(concept.prerequisites?.length ?? 0) > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {concept.prerequisites?.slice(0, 2).map((p) => (
                        <span
                          key={p}
                          className="inline-block px-2 py-1 bg-gray-100 rounded text-xs"
                        >
                          {truncate(p, 15)}
                        </span>
                      ))}
                      {(concept.prerequisites?.length ?? 0) > 2 && (
                        <span className="text-xs text-gray-500">
                          +{(concept.prerequisites?.length ?? 0) - 2} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">None</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestRetrieval(concept)}
                    className="gap-1"
                  >
                    Test
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
