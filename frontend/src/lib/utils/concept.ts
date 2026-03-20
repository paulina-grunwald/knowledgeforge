/**
 * Concept utility functions for filtering, sorting, and statistics.
 */

import { ConceptItem } from "@/lib/api";

export interface ConceptStats {
  totalConcepts: number;
  withPrerequisites: number;
  foundational: number;
  avgPrerequisites: number;
  maxPrerequisiteDepth: number;
}

/**
 * Filter concepts by search query and prerequisite filter.
 */
export function filterConcepts(
  concepts: ConceptItem[],
  searchQuery: string,
  filterBy: "all" | "has_prerequisites" | "no_prerequisites"
): ConceptItem[] {
  let filtered = concepts;

  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.definition.toLowerCase().includes(query)
    );
  }

  // Apply prerequisite filter
  if (filterBy === "has_prerequisites") {
    filtered = filtered.filter((c) => c.prerequisites.length > 0);
  } else if (filterBy === "no_prerequisites") {
    filtered = filtered.filter((c) => c.prerequisites.length === 0);
  }

  return filtered;
}

/**
 * Sort concepts by the specified criteria.
 */
export function sortConcepts(
  concepts: ConceptItem[],
  sortBy: "name" | "definition_length" | "prerequisites_count"
): ConceptItem[] {
  const sorted = [...concepts];

  switch (sortBy) {
    case "name":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "definition_length":
      sorted.sort((a, b) => b.definition.length - a.definition.length);
      break;
    case "prerequisites_count":
      sorted.sort((a, b) => b.prerequisites.length - a.prerequisites.length);
      break;
  }

  return sorted;
}

/**
 * Calculate aggregate statistics for concepts.
 */
export function calculateConceptStats(concepts: ConceptItem[]): ConceptStats {
  const totalConcepts = concepts.length;
  const withPrerequisites = concepts.filter((c) => c.prerequisites.length > 0).length;
  const foundational = concepts.filter((c) => c.prerequisites.length === 0).length;
  const avgPrerequisites =
    totalConcepts > 0
      ? concepts.reduce((sum, c) => sum + c.prerequisites.length, 0) / totalConcepts
      : 0;

  // For max depth, we'd need to build a graph and traverse it
  // For now, use a simple heuristic: max number of prerequisites any concept has
  const maxPrerequisiteDepth = Math.max(
    0,
    ...concepts.map((c) => c.prerequisites.length)
  );

  return {
    totalConcepts,
    withPrerequisites,
    foundational,
    avgPrerequisites,
    maxPrerequisiteDepth,
  };
}

/**
 * Find the prerequisite chain for a concept.
 * Returns an array of concepts that must be learned before the target concept.
 */
export function findPrerequisiteChain(
  conceptName: string,
  allConcepts: ConceptItem[]
): ConceptItem[] {
  const chain: ConceptItem[] = [];
  const visited = new Set<string>();

  function traverse(name: string) {
    if (visited.has(name)) return;
    visited.add(name);

    const concept = allConcepts.find((c) => c.name === name);
    if (!concept) return;

    for (const prereqName of concept.prerequisites) {
      const prereqConcept = allConcepts.find((c) => c.name === prereqName);
      if (prereqConcept && !visited.has(prereqName)) {
        chain.push(prereqConcept);
        traverse(prereqName);
      }
    }
  }

  traverse(conceptName);
  return chain;
}
