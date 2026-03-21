/**
 * Concept Explorer Page - Full-page view for exploring concepts in a study set.
 * Features: search, filtering, sorting, prerequisite navigation, test retrieval.
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks";
import { ConceptItem, getCorpusStatus, listConcepts, CorpusDetail } from "@/lib/api";
import { ErrorBoundary } from "@/components/shared";
import { ConceptsPageHeader } from "@/components/concepts/ConceptsPageHeader";
import { ConceptsFilterPanel } from "@/components/concepts/ConceptsFilterPanel";
import { ConceptsTable } from "@/components/concepts/ConceptsTable";
import { ConceptQuickActions } from "@/components/concepts/ConceptQuickActions";
import { LoadingSkeleton, EmptyState } from "@/components/shared";
import { filterConcepts, sortConcepts, calculateConceptStats } from "@/lib/utils/concept";
import { Zap } from "lucide-react";

type SortBy = "name" | "definition_length" | "prerequisites_count";
type FilterBy = "all" | "has_prerequisites" | "no_prerequisites";

interface ConceptsPageProps {
  params: {
    id: string;
  };
}

export default function ConceptsPage({ params }: ConceptsPageProps) {
  const { id: corpusId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Data fetching states
  const [concepts, setConcepts] = useState<ConceptItem[]>([]);
  const [corpus, setCorpus] = useState<CorpusDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter/sort states
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("q") || ""
  );
  const [sortBy, setSortBy] = useState<SortBy>(
    (searchParams.get("sort") as SortBy) || "name"
  );
  const [filterBy, setFilterBy] = useState<FilterBy>(
    (searchParams.get("filter") as FilterBy) || "all"
  );

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch concepts and corpus data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [conceptsData, corpusData] = await Promise.all([
          listConcepts(corpusId),
          getCorpusStatus(corpusId),
        ]);
        setConcepts(conceptsData);
        setCorpus(corpusData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load concepts");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [corpusId]);

  // Apply filters and sorting
  const filteredConcepts = useMemo(() => {
    const filtered = filterConcepts(concepts, debouncedSearchQuery, filterBy);
    return sortConcepts(filtered, sortBy);
  }, [concepts, debouncedSearchQuery, filterBy, sortBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    return calculateConceptStats(concepts);
  }, [concepts]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (sortBy !== "name") params.set("sort", sortBy);
    if (filterBy !== "all") params.set("filter", filterBy);

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : "";
    router.push(newUrl, { scroll: false });
  }, [searchQuery, sortBy, filterBy, router]);

  // Update state from URL on mount
  useEffect(() => {
    const q = searchParams.get("q");
    const sort = searchParams.get("sort") as SortBy;
    const filter = searchParams.get("filter") as FilterBy;

    if (q) setSearchQuery(q);
    if (sort) setSortBy(sort);
    if (filter) setFilterBy(filter);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-10 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-5 bg-gray-100 rounded w-96 animate-pulse"></div>
          </div>
          <LoadingSkeleton type="table" count={8} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <EmptyState
            icon={() => <div className="text-4xl">⚠️</div>}
            title="Error Loading Concepts"
            description={error}
            action={{ label: "Go Back", onClick: () => router.back() }}
          />
        </div>
      </div>
    );
  }

  if (!corpus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <EmptyState
            icon={() => <div className="text-4xl">📚</div>}
            title="Study Set Not Found"
            description="The requested study set could not be found."
            action={{ label: "Go Back", onClick: () => router.back() }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <ErrorBoundary>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <ConceptsPageHeader
            corpusName={corpus.name}
            conceptCount={concepts.length}
          />

          {/* Main three-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar: Filters */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <ConceptsFilterPanel
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  filterBy={filterBy}
                  onFilterChange={setFilterBy}
                  stats={stats}
                />
              </div>
            </div>

            {/* Center: Concepts Table */}
            <div className="lg:col-span-2">
              {filteredConcepts.length === 0 && concepts.length > 0 ? (
                <EmptyState
                  icon={() => <Zap className="w-12 h-12" />}
                  title="No concepts found"
                  description={`No concepts match your search "${debouncedSearchQuery}" with the selected filters.`}
                />
              ) : (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <ConceptsTable
                    concepts={filteredConcepts}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                  />
                </div>
              )}
            </div>

            {/* Right Sidebar: Quick Actions */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-6">
                <ConceptQuickActions
                  corpus={corpus}
                  stats={stats}
                  conceptCount={concepts.length}
                />
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
}
