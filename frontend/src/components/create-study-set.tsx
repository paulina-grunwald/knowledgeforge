"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCorpus } from "@/lib/api";

interface Props {
  selectedDocIds: Set<string>;
  onCreated: () => void;
}

export function CreateStudySet({ selectedDocIds, onCreated }: Props) {
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Enter a name for the study set");
      return;
    }
    if (selectedDocIds.size === 0) {
      setError("Select at least one document");
      return;
    }

    setCreating(true);
    setError("");

    try {
      await createCorpus(name.trim(), Array.from(selectedDocIds));
      setName("");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Study Set</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Label htmlFor="setName">Study Set Name</Label>
            <Input
              id="setName"
              placeholder="e.g. NVIDIA Agentic AI"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={creating || selectedDocIds.size === 0}
          >
            {creating ? "Creating..." : `Create (${selectedDocIds.size} docs)`}
          </Button>
        </div>
        {error && (
          <p className="text-destructive text-sm mt-2">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
