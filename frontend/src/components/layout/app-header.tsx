"use client";

import { usePathname } from "next/navigation";
import { User } from "lucide-react";

function getPageTitle(pathname: string): string {
  if (pathname === "/app") return "Library";
  return "KnowledgeForge";
}

export function AppHeader() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="h-14 border-b border-border bg-card flex items-center px-6 shrink-0">
      <h1 className="text-base font-semibold text-foreground">{title}</h1>
      <div className="ml-auto w-8 h-8 rounded-full bg-brand-muted flex items-center justify-center">
        <User className="w-4 h-4 text-brand" />
      </div>
    </header>
  );
}
