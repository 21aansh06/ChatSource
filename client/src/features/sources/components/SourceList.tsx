'use client';

import React, { useState } from 'react';
import { useSourcesQuery } from '../api/use-sources';
import { SourceCard } from './SourceCard';
import { AddSourceDialog } from './AddSourceDialog';
import { DeleteSourceDialog } from './DeleteSourceDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Source } from '@/lib/api/types';
import { Layers, Plus, RefreshCw, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

interface SourceListProps {
  notebookId: string;
}

export function SourceList({ notebookId }: SourceListProps) {
  const { data: sources, isLoading, isError, error, refetch } = useSourcesQuery(notebookId);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingSource, setDeletingSource] = useState<Source | null>(null);

  const readyCount = sources?.filter(
    (s) => s.status === 'COMPLETED' || s.status === 'READY'
  ).length || 0;

  const ingestingCount = sources?.filter(
    (s) => s.status === 'PENDING' || s.status === 'PROCESSING'
  ).length || 0;

  return (
    <div className="space-y-5 rounded-xl border border-brand-medium bg-card p-5 shadow-xs">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-brand-medium">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-medium border border-brand-dark text-foreground">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground leading-tight flex items-center gap-2">
              <span>Notebook Sources</span>
              {sources && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-medium border border-brand-dark text-foreground">
                  {sources.length}
                </span>
              )}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              PDF, Website URL, or Raw Text containers for grounded RAG.
            </p>
          </div>
        </div>

        <Button onClick={() => setIsAddOpen(true)} size="sm" className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" />
          <span>Add Source</span>
        </Button>
      </div>

      {/* Ingestion & Readiness Status Bar */}
      {sources && sources.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-brand-light p-3 border border-brand-medium text-xs">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <CheckCircle2 className="h-4 w-4 text-foreground" />
            <span>
              <strong className="font-bold">{readyCount} of {sources.length}</strong> sources ready for chat
            </span>
          </div>

          {ingestingCount > 0 && (
            <div className="flex items-center gap-1.5 font-semibold text-foreground bg-brand-medium px-2.5 py-1 rounded border border-brand-dark animate-pulse">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>{ingestingCount} processing (auto-refreshing)</span>
            </div>
          )}
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="rounded-xl border border-brand-medium bg-card p-4 space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-32 rounded" />
                <Skeleton className="h-6 w-16 rounded" />
              </div>
              <Skeleton className="h-4 w-full rounded" />
              <div className="pt-2 border-t border-brand-medium flex justify-between">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-5 w-24 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="rounded-xl border border-brand-dark bg-brand-medium/50 p-6 text-center space-y-3">
          <AlertCircle className="h-6 w-6 mx-auto text-foreground" />
          <div>
            <h4 className="font-bold text-sm text-foreground">Failed to load sources</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {error?.message || 'Error communicating with server.'}
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2 mx-auto">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry</span>
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && sources?.length === 0 && (
        <div className="rounded-xl border border-dashed border-brand-dark bg-brand-light p-8 text-center space-y-4">
          <div className="h-12 w-12 rounded-xl bg-brand-medium border border-brand-dark flex items-center justify-center mx-auto text-foreground">
            <Layers className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-base text-foreground">No Sources Added Yet</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Upload a PDF document, ingest a website URL, or paste raw text. Ingestion will automatically parse and index your data.
            </p>
          </div>
          <Button onClick={() => setIsAddOpen(true)} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Add First Source</span>
          </Button>
        </div>
      )}

      {/* Source Cards Grid */}
      {!isLoading && !isError && sources && sources.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              onDelete={(src) => setDeletingSource(src)}
            />
          ))}
        </div>
      )}

      {/* Dialog Modals */}
      <AddSourceDialog
        notebookId={notebookId}
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />

      <DeleteSourceDialog
        notebookId={notebookId}
        source={deletingSource}
        isOpen={Boolean(deletingSource)}
        onClose={() => setDeletingSource(null)}
      />
    </div>
  );
}
