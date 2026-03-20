/**
 * Left sidebar with search, sorting, filtering, and statistics.
 */

"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";

interface ConceptStats {
  totalConcepts: number;
  withPrerequisites: number;
  foundational: number;
  avgPrerequisites: number;
  maxPrerequisiteDepth: number;
}

interface ConceptsFilterPanelProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: "name" | "definition_length" | "prerequisites_count";
  onSortChange: (sort: "name" | "definition_length" | "prerequisites_count") => void;
  filterBy: "all" | "has_prerequisites" | "no_prerequisites";
  onFilterChange: (filter: "all" | "has_prerequisites" | "no_prerequisites") => void;
  stats: ConceptStats;
}

export function ConceptsFilterPanel({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  filterBy,
  onFilterChange,
  stats,
}: ConceptsFilterPanelProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <Card className="p-4 space-y-3">
        <h3 className="font-semibold text-sm text-gray-900">Search</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search concepts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </Card>

      {/* Sort */}
      <Card className="p-4 space-y-3">
        <h3 className="font-semibold text-sm text-gray-900">Sort By</h3>
        <Select value={sortBy} onValueChange={(value: any) => onSortChange(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name (A-Z)</SelectItem>
            <SelectItem value="definition_length">Definition Length</SelectItem>
            <SelectItem value="prerequisites_count">Prerequisites</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      {/* Filter */}
      <Card className="p-4 space-y-3">
        <h3 className="font-semibold text-sm text-gray-900">Filter By</h3>
        <Select
          value={filterBy}
          onValueChange={(value: any) => onFilterChange(value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Concepts</SelectItem>
            <SelectItem value="has_prerequisites">Has Prerequisites</SelectItem>
            <SelectItem value="no_prerequisites">No Prerequisites</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      {/* Statistics Card */}
      <Card className="p-4 space-y-3 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100">
        <h3 className="font-semibold text-sm text-gray-900">Statistics</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Concepts</span>
            <span className="font-medium text-gray-900">{stats.totalConcepts}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">With Prerequisites</span>
            <span className="font-medium text-gray-900">{stats.withPrerequisites}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Foundational</span>
            <span className="font-medium text-gray-900">{stats.foundational}</span>
          </div>
          <div className="border-t border-blue-200 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Prerequisites</span>
              <span className="font-medium text-gray-900">
                {stats.avgPrerequisites.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
