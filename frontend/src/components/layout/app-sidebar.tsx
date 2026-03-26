"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen } from "lucide-react";

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
}

function NavItem({ href, icon: Icon, label }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </Link>
  );
}

export function AppSidebar() {
  return (
    <aside className="w-64 h-screen border-r border-sidebar-border bg-sidebar flex flex-col shrink-0">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-brand-foreground" />
          </div>
          <span className="font-semibold text-base tracking-tight text-foreground">
            KnowledgeForge
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <NavItem href="/app" icon={BookOpen} label="Library" />
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <p className="text-xs text-muted-foreground">Adaptive AI Study Agent</p>
      </div>
    </aside>
  );
}
