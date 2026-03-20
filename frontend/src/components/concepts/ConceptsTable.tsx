/**
 * Enhanced concepts table with full definitions, sortable headers, and actions.
 */

"use client";

import { ConceptItem } from "@/lib/api";
import { PrerequisiteChip } from "./PrerequisiteChip";
import { ArrowUpDown, ArrowUp } from "lucide-react";

interface ConceptsTableProps {
  concepts: ConceptItem[];
  sortBy: "name" | "definition_length" | "prerequisites_count";
  onSortChange: (
    sort: "name" | "definition_length" | "prerequisites_count",
  ) => void;
}

export function ConceptsTable({
  concepts,
  sortBy,
  onSortChange,
}: ConceptsTableProps) {
  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy === column) {
      return <ArrowUp className="w-4 h-4 text-blue-600" />;
    }
    return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
  };

  const sortColumn = (
    column: "name" | "definition_length" | "prerequisites_count",
  ) => {
    onSortChange(column);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-4 text-left font-semibold text-gray-700">
              <button
                onClick={() => sortColumn("name")}
                className="flex items-center gap-2 hover:text-gray-900 transition"
              >
                Name
                <SortIcon column="name" />
              </button>
            </th>
            <th className="px-6 py-4 text-left font-semibold text-gray-700">
              <button
                onClick={() => sortColumn("definition_length")}
                className="flex items-center gap-2 hover:text-gray-900 transition"
              >
                Definition
                <SortIcon column="definition_length" />
              </button>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {concepts.map((concept) => (
            <tr
              key={concept.concept_id}
              className="hover:bg-gray-50 transition"
            >
              <td className="px-6 py-4 font-medium text-gray-900 max-w-xs">
                {concept.name}
              </td>
              <td className="px-6 py-4 text-gray-600 max-w-md">
                <p>{concept.definition}</p>
              </td>
              <td className="px-6 py-4 text-gray-600">
                {concept.prerequisites.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {concept.prerequisites.slice(0, 3).map((prereq, idx) => (
                      <PrerequisiteChip
                        key={`${concept.concept_id}-prereq-${idx}`}
                        name={prereq}
                      />
                    ))}
                    {concept.prerequisites.length > 3 && (
                      <span className="text-xs text-gray-500 inline-flex items-center">
                        +{concept.prerequisites.length - 3} more
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400 text-xs">None</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
