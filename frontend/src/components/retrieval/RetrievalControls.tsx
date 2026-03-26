/**
 * Input controls for retrieval playground.
 * Includes corpus selector, concept input, top-N slider, and retrieve button.
 */

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { DebugRetrieveRequest, CorpusListItem, listCorpora } from "@/lib/api";
import { useLocalStorage, useDebounce } from "@/hooks";
import { normalizeString, validateConceptQuery } from "@/lib/utils/validation";
import { LoadingSkeleton, EmptyState } from "@/components/shared";
import { AlertCircle, Zap } from "lucide-react";

interface RetrievalControlsProps {
  onRetrieve: (params: DebugRetrieveRequest) => void;
  loading: boolean;
}

export function RetrievalControls({ onRetrieve, loading }: RetrievalControlsProps) {
  const [corpora, setCorpora] = useState<CorpusListItem[]>([]);
  const [corporaLoading, setCorporaLoading] = useState(true);
  const [corporaError, setCorporaError] = useState<string | null>(null);

  const [selectedCorpus, setSelectedCorpus] = useLocalStorage<string>("selectedCorpus", "");
  const [conceptName, setConceptName] = useState("");
  const [topN, setTopN] = useState(5);
  const [error, setError] = useState<string | null>(null);

  const debouncedConcept = useDebounce(conceptName, 300);

  // Load corpora on mount
  useEffect(() => {
    const loadCorpora = async () => {
      try {
        setCorporaLoading(true);
        const data = await listCorpora();
        const readyCorpora = data.filter((c) => c.status === "ready");
        setCorpora(readyCorpora);

        if (readyCorpora.length === 0) {
          setCorporaError("No ready corpora. Please ingest a corpus first.");
          setSelectedCorpus(""); // Clear any stale selection
        } else {
          setCorporaError(null);

          // Validate selected corpus is in ready list, otherwise clear it
          if (selectedCorpus && !readyCorpora.some((c) => c.corpus_id === selectedCorpus)) {
            setSelectedCorpus(readyCorpora[0].corpus_id);
          } else if (!selectedCorpus) {
            // Set first ready corpus as default (only if not already set)
            setSelectedCorpus(readyCorpora[0].corpus_id);
          }
        }
      } catch (err) {
        setCorporaError(err instanceof Error ? err.message : "Failed to load corpora");
      } finally {
        setCorporaLoading(false);
      }
    };

    loadCorpora();
  }, []);

  // Validate concept name
  useEffect(() => {
    if (conceptName) {
      const validationError = validateConceptQuery(conceptName);
      setError(validationError);
    } else {
      setError(null);
    }
  }, [conceptName]);

  const handleRetrieve = () => {
    if (!selectedCorpus) {
      setError("Please select a corpus");
      return;
    }
    if (!conceptName.trim()) {
      setError("Please enter a concept name");
      return;
    }

    onRetrieve({
      corpus_id: selectedCorpus,
      concept_name: normalizeString(conceptName),
      top_n: topN,
    });
  };

  const isDisabled = loading || !selectedCorpus || !conceptName.trim() || !!error;

  if (corporaError) {
    return (
      <Card className="p-6">
        <EmptyState
          icon={AlertCircle}
          title="No Ready Corpora"
          description={corporaError}
        />
      </Card>
    );
  }

  if (corporaLoading) {
    return (
      <Card className="p-6">
        <LoadingSkeleton type="text" count={3} />
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Retrieval Controls
        </h2>
      </div>

      <div className="space-y-2">
        <Label htmlFor="corpus-select">Study Set</Label>
        <Select value={selectedCorpus} onValueChange={setSelectedCorpus}>
          <SelectTrigger id="corpus-select">
            <SelectValue placeholder="Select a study set" />
          </SelectTrigger>
          <SelectContent>
            {corpora.map((corpus) => (
              <SelectItem key={corpus.corpus_id} value={corpus.corpus_id}>
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{corpus.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {corpus.concept_count} concepts • {corpus.chunk_count} chunks
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="concept-input">Concept Name</Label>
        <Input
          id="concept-input"
          placeholder="e.g., Event loop, Async/await, Decorators"
          value={conceptName}
          onChange={(e) => setConceptName(e.target.value)}
          disabled={loading}
        />
        <p className="text-xs text-gray-500">
          {conceptName.length}/500 characters
        </p>
      </div>

      <div className="space-y-3">
        <Label htmlFor="top-n-slider">
          Top Results: <span className="font-semibold">{topN}</span>
        </Label>
        <Slider
          id="top-n-slider"
          min={1}
          max={20}
          step={1}
          value={[topN]}
          onValueChange={(value) => setTopN(value[0])}
          disabled={loading}
          className="w-full"
        />
        <p className="text-xs text-gray-500">
          Show {topN} most relevant chunk{topN !== 1 ? "s" : ""}
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <Button
        onClick={handleRetrieve}
        disabled={isDisabled}
        className="w-full"
        size="lg"
      >
        {loading ? "Retrieving..." : "Retrieve"}
      </Button>
    </Card>
  );
}
