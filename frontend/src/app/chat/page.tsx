/**
 * Chat interface page - for session-based adaptive learning.
 * Phase 2: Placeholder with echo behavior
 * Phase 3: Will integrate LangGraph agent
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ContextPanel } from "@/components/chat/ContextPanel";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { Send } from "lucide-react";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      content: "Chat interface ready. Phase 3 will add adaptive learning.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Phase 2: Echo behavior
      // Phase 3: Replace with LangGraph agent call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const assistantMessage: Message = {
        role: "assistant",
        content: `[Phase 3 placeholder] You said: "${input}"\n\nThis is where the adaptive learning agent will provide Socratic questions and teach-back exercises.`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Something went wrong"}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <ErrorBoundary>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Chat</h1>
            <p className="text-gray-600">
              Adaptive learning agent (Phase 3 ready)
            </p>
          </div>

          {/* Layout: Chat (2/3) + Context (1/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chat messages */}
            <div className="lg:col-span-2">
              <Card className="h-[600px] flex flex-col">
                {/* Messages area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-2">
                  {messages.map((msg, idx) => (
                    <MessageBubble
                      key={idx}
                      role={msg.role}
                      content={msg.content}
                      timestamp={msg.timestamp}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input area */}
                <div className="border-t border-gray-200 p-4 space-y-3">
                  <Textarea
                    placeholder="Type your message... (Shift+Enter for newline)"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    className="min-h-[100px] resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {input.length}/500 characters
                    </span>
                    <Button
                      onClick={handleSendMessage}
                      disabled={loading || !input.trim()}
                      className="gap-2"
                    >
                      {loading ? "Sending..." : "Send"}
                      {!loading && <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Context panel */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <ContextPanel chunks={null} loading={loading} />
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
}
