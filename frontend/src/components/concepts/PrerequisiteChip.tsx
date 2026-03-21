/**
 * Clickable prerequisite badge component.
 */

"use client";

import { Badge } from "@/components/ui/badge";

interface PrerequisiteChipProps {
  name: string;
  onClick?: () => void;
}

export function PrerequisiteChip({ name, onClick }: PrerequisiteChipProps) {
  return (
    <Badge
      variant="secondary"
      className="cursor-pointer hover:bg-gray-300 transition text-xs"
      onClick={onClick}
    >
      {name.length > 15 ? `${name.slice(0, 12)}...` : name}
    </Badge>
  );
}
