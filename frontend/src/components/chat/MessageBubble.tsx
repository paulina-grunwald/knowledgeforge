/**
 * Single message bubble in chat interface.
 * Supports user, assistant, and system message types.
 */

import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

interface MessageBubbleProps {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
}

export function MessageBubble({ role, content, timestamp }: MessageBubbleProps) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
  };

  if (role === "system") {
    return (
      <div className="flex justify-center py-4">
        <p className="text-xs text-gray-500 italic max-w-sm text-center">{content}</p>
      </div>
    );
  }

  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[70%] rounded-lg p-4 ${
          isUser
            ? "bg-blue-500 text-white"
            : "bg-gray-100 text-gray-900"
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {content}
        </p>

        {!isUser && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-300">
            {timestamp && (
              <span className="text-xs text-gray-500">
                {timestamp.toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="h-6 w-6 p-0"
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
