import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Sparkles,
  ArrowRight,
  Upload,
  Brain,
  Search,
  MessageCircle,
} from "lucide-react";

const features = [
  {
    icon: Upload,
    title: "Upload Documents",
    description:
      "PDF, TXT, and Markdown files. Automatic deduplication keeps your library clean.",
  },
  {
    icon: Brain,
    title: "Extract Concepts",
    description:
      "AI identifies key concepts and their prerequisites, building a knowledge graph of your material.",
  },
  {
    icon: Search,
    title: "Semantic Retrieval",
    description:
      "Hybrid BM25 + vector search with multi-query expansion surfaces the most relevant context.",
  },
  {
    icon: MessageCircle,
    title: "Socratic Dialogue",
    description:
      "LangGraph agent asks targeted questions, evaluates answers, and adapts to your knowledge level.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-brand-foreground" />
            </div>
            <span className="font-semibold text-base tracking-tight">
              KnowledgeForge
            </span>
          </div>
          <Link href="/app">
            <Button className="bg-brand hover:bg-brand-700 text-brand-foreground rounded-lg">
              Open App
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 bg-brand-subtle border border-brand-200 text-brand rounded-full px-3 py-1 text-xs font-medium mb-6">
            <Sparkles className="w-3 h-3" />
            Powered by RAG + LangGraph
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight mb-6 text-foreground">
            Study smarter with{" "}
            <span className="text-brand">adaptive AI</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Upload your study materials, extract concepts automatically, and
            learn through Socratic dialogue — powered by retrieval-augmented
            generation.
          </p>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/app">
              <Button
                size="lg"
                className="bg-brand hover:bg-brand-700 text-brand-foreground gap-2 px-8 h-12 text-base rounded-xl shadow-md shadow-brand/20"
              >
                Start Learning
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button
                variant="outline"
                size="lg"
                className="h-12 text-base px-8 rounded-xl"
              >
                How it works
              </Button>
            </Link>
          </div>

          {/* Decorative app preview */}
          <div className="mt-16 rounded-2xl border border-border shadow-2xl bg-card p-6 pointer-events-none select-none">
            <div className="grid grid-cols-3 gap-3">
              {/* Upload zone mock */}
              <div className="rounded-xl border-2 border-dashed border-brand-200 bg-brand-subtle p-4 text-center">
                <Upload className="w-6 h-6 text-brand mx-auto mb-2" />
                <div className="h-2 bg-brand-muted rounded w-3/4 mx-auto mb-1" />
                <div className="h-2 bg-brand-muted rounded w-1/2 mx-auto" />
              </div>
              {/* Study set mock */}
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="h-2 bg-brand rounded w-2/3 mb-3" />
                <div className="h-2 bg-muted rounded w-full mb-1.5" />
                <div className="h-2 bg-muted rounded w-5/6 mb-1.5" />
                <div className="h-2 bg-muted rounded w-4/6" />
              </div>
              {/* Concepts mock */}
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex gap-1 mb-2 flex-wrap">
                  {[80, 60, 70, 50, 65].map((w, i) => (
                    <div
                      key={i}
                      className="h-5 bg-brand-muted rounded-full"
                      style={{ width: `${w}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="how-it-works"
        className="py-20 px-6 bg-muted/30 border-y border-border"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-3 text-foreground">
              How KnowledgeForge works
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From raw documents to adaptive dialogue in four steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-brand-200 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-subtle flex items-center justify-center mb-4 group-hover:bg-brand-muted transition-colors">
                  <Icon className="w-5 h-5 text-brand" />
                </div>
                <h3 className="font-semibold mb-2 text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-6 h-6 rounded-md bg-brand flex items-center justify-center">
                <BookOpen className="w-3.5 h-3.5 text-brand-foreground" />
              </div>
              <span className="font-semibold text-sm">KnowledgeForge</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Adaptive AI study agent
            </p>
          </div>

          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link
              href="/app"
              className="hover:text-foreground transition-colors"
            >
              Library
            </Link>
          </nav>

          <p className="text-xs text-muted-foreground">
            Built with Next.js 15 + FastAPI
          </p>
        </div>
      </footer>
    </div>
  );
}
