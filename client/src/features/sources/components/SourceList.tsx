'use client';

import React, { useState } from 'react';
import { useSourcesQuery } from '../api/use-sources';
import { SourceCard } from './SourceCard';
import { AddSourceDialog } from './AddSourceDialog';
import { DeleteSourceDialog } from './DeleteSourceDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Source } from '@/lib/api/types';
import { Layers, Plus, RefreshCw, AlertCircle, Loader2, CheckCircle2, Search, FileText, Globe, AlignLeft, Filter } from 'lucide-react';

interface SourceListProps {
  notebookId: string;
  onOpenAddDialog?: () => void;
}

export function SourceList({ notebookId, onOpenAddDialog }: SourceListProps) {
  const { data: sources, isLoading, isError, error, refetch } = useSourcesQuery(notebookId);

  const [isAddOpenInternal, setIsAddOpenInternal] = useState(false);
  const [deletingSource, setDeletingSource] = useState<Source | null>(null);

  const handleOpenAdd = () => {
    if (onOpenAddDialog) {
      onOpenAddDialog();
    } else {
      setIsAddOpenInternal(true);
    }
  };

  // Presentational Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PDF' | 'WEBSITE' | 'TEXT' | 'YOUTUBE'>('ALL');

  const readyCount = sources?.filter(
    (s) => s.status === 'COMPLETED' || s.status === 'READY'
  ).length || 0;

  const ingestingCount = sources?.filter(
    (s) => s.status === 'PENDING' || s.status === 'PROCESSING'
  ).length || 0;

  // Safe Filtered source list
  const filteredSources = sources?.filter((source) => {
    const titleText = source.title || '';
    const urlText = source.url || '';
    const matchesSearch =
      titleText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      urlText.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'ALL' || source.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm font-sans overflow-hidden">
      {/* Panel Header Bar */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-2xs">
            <Layers className="h-4.5 w-4.5 text-sky-400" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 leading-none flex items-center gap-2 font-heading">
              <span>Source Library</span>
              {sources && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-mono">
                  {sources.length}
                </span>
              )}
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Ground-truth context</p>
          </div>
        </div>

        <Button
          onClick={handleOpenAdd}
          size="sm"
          className="gap-1 px-2.5 py-1 text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white border-0 shadow-2xs cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add</span>
        </Button>
      </div>

      {/* Ingestion Processing Indicator Banner */}
      {ingestingCount > 0 && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-amber-50 p-2.5 border border-amber-200 text-xs font-bold text-amber-800 animate-pulse shrink-0">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-amber-600 shrink-0" />
            <span>{ingestingCount} source(s) chunking & embedding...</span>
          </div>
          <span className="text-[10px] uppercase font-mono text-amber-600">Auto-refreshing</span>
        </div>
      )}

      {/* Search & Filter Controls */}
      {sources && sources.length > 0 && (
        <div className="mt-3 space-y-2 shrink-0">
          {/* Search Input */}
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sources by title or URL..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900 transition-all"
            />
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-0.5">
            <span className="text-slate-400 font-bold mr-0.5 flex items-center gap-1">
              <Filter className="h-3 w-3" />
            </span>
            {(['ALL', 'PDF', 'WEBSITE', 'TEXT', 'YOUTUBE'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  typeFilter === type
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Sources Content Area */}
      <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-3 min-h-0">
        {/* Loading Skeleton */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-5 w-32 rounded-md" />
                  <Skeleton className="h-5 w-14 rounded-md" />
                </div>
                <Skeleton className="h-3 w-3/4 rounded-md" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-5 text-center space-y-3">
            <AlertCircle className="h-5 w-5 mx-auto text-rose-600" />
            <p className="text-xs text-slate-600 font-medium">Failed to load sources.</p>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2 mx-auto text-xs">
              <RefreshCw className="h-3 w-3" />
              <span>Retry</span>
            </Button>
          </div>
        )}

        {/* Empty State when zero sources exist */}
        {!isLoading && !isError && sources?.length === 0 && (
          <div
            onClick={handleOpenAdd}
            className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-sky-300 rounded-2xl p-6 text-center space-y-3 transition-colors cursor-pointer bg-slate-50/30 group"
          >
            <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 text-sky-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
              <Plus className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-slate-900 font-heading">Add First Source</h4>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Click here to upload PDFs, ingest YouTube video links, website URLs, or raw text.
              </p>
            </div>
          </div>
        )}

        {/* Filtered Empty State */}
        {!isLoading && !isError && sources && sources.length > 0 && filteredSources?.length === 0 && (
          <div className="p-6 text-center text-xs text-slate-400 space-y-2">
            <p className="font-semibold text-slate-600">No matching sources found</p>
            <button
              onClick={() => { setSearchQuery(''); setTypeFilter('ALL'); }}
              className="text-sky-600 hover:underline font-bold cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Source Cards List */}
        {!isLoading && !isError && filteredSources && filteredSources.length > 0 && (
          <div className="space-y-3">
            {filteredSources.map((source) => (
              <SourceCard
                key={source.id}
                source={source}
                onDelete={(src) => setDeletingSource(src)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Quick Add Trigger Bar */}
      {sources && sources.length > 0 && (
        <div className="pt-3 border-t border-slate-100 shrink-0">
          <button
            onClick={handleOpenAdd}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed border-slate-300 hover:border-sky-400 hover:bg-sky-50/50 text-xs font-bold text-slate-700 hover:text-sky-700 transition-all cursor-pointer font-heading"
          >
            <Plus className="h-3.5 w-3.5 text-sky-600" />
            <span>Add More Sources</span>
          </button>
        </div>
      )}

      {/* Dialog Modals */}
      <AddSourceDialog
        notebookId={notebookId}
        isOpen={isAddOpenInternal}
        onClose={() => setIsAddOpenInternal(false)}
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
