'use client';

import Link from 'next/link';
import { useAuth, SignInButton, SignUpButton } from '@clerk/nextjs';
import { BookOpen, FileText, Globe, MessageSquare, ShieldCheck, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24 border-b border-brand-medium bg-brand-light">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-dark bg-brand-medium px-3.5 py-1.5 text-xs font-semibold text-foreground mb-6 shadow-xs">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Next-Generation Notebook RAG Platform</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl max-w-3xl mx-auto leading-tight">
            Ground-Truth AI Answers From Your Own Sources
          </h1>

          <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Organize documents, website links, and raw notes into isolated notebooks. Query your knowledge with real-time SSE streaming answers backed by precise citations.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {!isLoaded ? (
              <div className="h-11 w-36 animate-pulse rounded-md bg-brand-medium" />
            ) : isSignedIn ? (
              <Link
                href="/notebooks"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span>Go to My Notebooks</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <SignUpButton mode="modal">
                  <button className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                    <span>Start Building Notebooks</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <button className="inline-flex items-center gap-2 rounded-md bg-brand-medium px-5 py-3 text-base font-medium text-foreground border border-brand-dark hover:bg-brand-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                    <span>Sign In</span>
                  </button>
                </SignInButton>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 bg-brand-light flex-1">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Built for Grounded Research & Verification
            </h2>
            <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
              Multi-source parsing with zero hallucination fallback mechanisms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="rounded-xl border border-brand-medium bg-card p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-lg bg-brand-medium border border-brand-dark flex items-center justify-center text-foreground mb-4">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Multi-Format Sources</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Ingest PDF documents, scrape website URLs, or directly paste raw text. Async ingestion tracks background chunking and vector indexing.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-brand-medium flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-foreground" />
                <span>PDF, Web & Text Ingestion</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="rounded-xl border border-brand-medium bg-card p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-lg bg-brand-medium border border-brand-dark flex items-center justify-center text-foreground mb-4">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Notebook-Scoped Chat</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Chat across all ready sources inside a notebook simultaneously. Answers stream token-by-token over native Server-Sent Events.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-brand-medium flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-foreground" />
                <span>Real-Time Token SSE Streaming</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="rounded-xl border border-brand-medium bg-card p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="h-10 w-10 rounded-lg bg-brand-medium border border-brand-dark flex items-center justify-center text-foreground mb-4">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Location-Exact Citations</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every assistant answer identifies which source was used down to PDF page numbers, website sections, or raw text line ranges.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-brand-medium flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-foreground" />
                <span>Source Location Metadata</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-brand-medium bg-brand-light py-6 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>NotebookLM ChatSource &copy; {new Date().getFullYear()}</span>
          <span className="font-mono text-[11px] text-muted-foreground">
            Brand Tokens: #ebedf1 • #d4d8df • #acadb1
          </span>
        </div>
      </footer>
    </div>
  );
}
