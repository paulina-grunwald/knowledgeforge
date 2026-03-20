"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Zap, GitCompare, MessageCircle } from "lucide-react";

export function Navigation() {
  const pathname = usePathname();

  const getActiveTab = (): string => {
    if (pathname === "/") return "library";
    if (pathname.startsWith("/retrieval/compare")) return "compare";
    if (pathname.startsWith("/retrieval")) return "retrieval";
    if (pathname.startsWith("/chat")) return "chat";
    return "library";
  };

  const activeTab = getActiveTab();

  return (
    <div className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <Tabs value={activeTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <Link href="/" className="contents">
              <TabsTrigger value="library" className="gap-2">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Library</span>
              </TabsTrigger>
            </Link>

            <Link href="/retrieval" className="contents">
              <TabsTrigger value="retrieval" className="gap-2">
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Retrieval</span>
              </TabsTrigger>
            </Link>

            <Link href="/retrieval/compare" className="contents">
              <TabsTrigger value="compare" className="gap-2">
                <GitCompare className="w-4 h-4" />
                <span className="hidden sm:inline">Compare</span>
              </TabsTrigger>
            </Link>

            <Link href="/chat" className="contents">
              <TabsTrigger value="chat" className="gap-2">
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Chat</span>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded ml-1">
                  Beta
                </span>
              </TabsTrigger>
            </Link>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
