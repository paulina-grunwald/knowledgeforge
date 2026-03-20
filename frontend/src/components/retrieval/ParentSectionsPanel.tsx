/**
 * Display parent document sections in accordion format.
 */

import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared";
import { BookOpen, Copy } from "lucide-react";

interface ParentSectionsPanelProps {
  sections: string[];
}

export function ParentSectionsPanel({ sections }: ParentSectionsPanelProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (sections.length === 0) {
    return (
      <Card className="p-6">
        <EmptyState
          icon={BookOpen}
          title="No Parent Sections"
          description="Increase chunk scores to reveal parent sections (score > 0.85)"
        />
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-lg">Parent Sections</h3>
        <span className="text-sm text-gray-500">({sections.length})</span>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {sections.map((section, idx) => (
          <AccordionItem
            key={idx}
            value={`section-${idx}`}
            className="border border-gray-200 rounded-lg px-4"
          >
            <div className="flex items-center justify-between">
              <AccordionTrigger className="flex-1 hover:no-underline">
                <span className="text-sm font-medium text-left">
                  Section {idx + 1} ({section.length} chars)
                </span>
              </AccordionTrigger>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(section);
                }}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <AccordionContent className="pt-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {section}
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Parent sections show full context for high-confidence chunks (score
          &gt; 0.85). Use these for understanding the retrieved chunks in
          their original context.
        </p>
      </div>
    </Card>
  );
}
