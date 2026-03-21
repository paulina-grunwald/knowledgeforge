import { ConceptItem } from "@/lib/api";

export interface ConceptStats {
  totalConcepts: number;
  withPrerequisites: number;
  foundational: number;
  avgPrerequisites: number;
  maxPrerequisiteDepth: number;
}

export function filterConcepts(
  concepts: ConceptItem[],
  searchQuery: string,
  filterBy: "all" | "has_prerequisites" | "no_prerequisites",
): ConceptItem[] {
  let filtered = concepts;

  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.definition.toLowerCase().includes(query),
    );
  }

  if (filterBy === "has_prerequisites") {
    filtered = filtered.filter((c) => (c.prerequisites?.length ?? 0) > 0);
  } else if (filterBy === "no_prerequisites") {
    filtered = filtered.filter((c) => (c.prerequisites?.length ?? 0) === 0);
  }

  return filtered;
}

export function sortConcepts(
  concepts: ConceptItem[],
  sortBy: "name" | "definition_length" | "prerequisites_count",
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
      sorted.sort(
        (a, b) =>
          (b.prerequisites?.length ?? 0) - (a.prerequisites?.length ?? 0),
      );
      break;
  }

  return sorted;
}

export function calculateConceptStats(concepts: ConceptItem[]): ConceptStats {
  const totalConcepts = concepts.length;
  const withPrerequisites = concepts.filter(
    (c) => (c.prerequisites?.length ?? 0) > 0,
  ).length;
  const foundational = concepts.filter(
    (c) => (c.prerequisites?.length ?? 0) === 0,
  ).length;
  const avgPrerequisites =
    totalConcepts > 0
      ? concepts.reduce((sum, c) => sum + (c.prerequisites?.length ?? 0), 0) /
        totalConcepts
      : 0;

  const maxPrerequisiteDepth = Math.max(
    0,
    ...concepts.map((c) => c.prerequisites?.length ?? 0),
  );

  return {
    totalConcepts,
    withPrerequisites,
    foundational,
    avgPrerequisites,
    maxPrerequisiteDepth,
  };
}

export function findPrerequisiteChain(
  conceptName: string,
  allConcepts: ConceptItem[],
): ConceptItem[] {
  const chain: ConceptItem[] = [];
  const visited = new Set<string>();

  function traverse(name: string) {
    if (visited.has(name)) return;
    visited.add(name);

    const concept = allConcepts.find((c) => c.name === name);
    if (!concept) return;

    if (concept.prerequisites) {
      for (const prereqName of concept.prerequisites) {
        const prereqConcept = allConcepts.find((c) => c.name === prereqName);
        if (prereqConcept && !visited.has(prereqName)) {
          chain.push(prereqConcept);
          traverse(prereqName);
        }
      }
    }
  }

  traverse(conceptName);
  return chain;
}
