'use client';

import React from 'react';
import { Source } from '@/lib/api/types';
import { FileText, Globe, AlignLeft, Video, Check, Layers, X, Sparkles, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SourceSelectorProps {
  sources: Source[];
  selectedSourceIds: string[];
  onChange: (selectedIds: string[]) => void;
  disabled?: boolean;
}

export function SourceSelector({
  sources,
  selectedSourceIds,
  onChange,
  disabled = false,
}: SourceSelectorProps) {
  const readySources = sources.filter(
    (s) => s.status === 'COMPLETED' || s.status === 'READY'
  );

  if (readySources.length === 0) {
    return null;
  }

  const isAllSelected = selectedSourceIds.length === 0 || selectedSourceIds.length === readySources.length;
  const isCustomSubset = selectedSourceIds.length > 0 && selectedSourceIds.length < readySources.length;

  const handleToggleSource = (sourceId: string) => {
    if (disabled) return;

    if (selectedSourceIds.length === 0) {
      // If currently "all", clicking one selects ONLY that one
      onChange([sourceId]);
      return;
    }

    if (selectedSourceIds.includes(sourceId)) {
      const next = selectedSourceIds.filter((id) => id !== sourceId);
      onChange(next);
    } else {
      const next = [...selectedSourceIds, sourceId];
      if (next.length === readySources.length) {
        onChange([]);
      } else {
        onChange(next);
      }
    }
  };

  const handleSelectAll = () => {
    if (disabled) return;
    onChange([]);
  };

  const handleRemoveSource = (e: React.MouseEvent, sourceId: string) => {
    e.stopPropagation();
    if (disabled) return;
    const next = selectedSourceIds.filter((id) => id !== sourceId);
    onChange(next);
  };

  const renderSourceIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <FileText className="h-3.5 w-3.5 text-sky-600 shrink-0" />;
      case 'WEBSITE':
        return <Globe className="h-3.5 w-3.5 text-emerald-600 shrink-0" />;
      case 'TEXT':
        return <AlignLeft className="h-3.5 w-3.5 text-indigo-600 shrink-0" />;
      case 'YOUTUBE':
        return <Video className="h-3.5 w-3.5 text-rose-600 shrink-0" />;
      default:
        return <FileText className="h-3.5 w-3.5 text-slate-500 shrink-0" />;
    }
  };

  return (
    <div className="flex flex-col gap-2 p-2.5 rounded-2xl bg-slate-50/80 border border-slate-200/90 shadow-2xs font-sans text-xs">
      {/* Header Scope & Helper */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-heading font-bold text-slate-800">
          <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
            <Filter className="h-3 w-3" />
          </div>
          <span>Focus AI on Sources:</span>
          {isAllSelected ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 border border-emerald-300/80 font-mono flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5 text-emerald-600" />
              All {readySources.length} Sources Active
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300 font-mono">
              {selectedSourceIds.length} of {readySources.length} Selected
            </span>
          )}
        </div>

        {isCustomSubset && (
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={disabled}
            className="text-[11px] font-bold text-sky-600 hover:text-sky-700 hover:underline cursor-pointer disabled:opacity-50 transition-colors"
          >
            Reset to All Sources
          </button>
        )}
      </div>

      {/* Interactive Source Chips */}
      <div className="flex flex-wrap items-center gap-1.5 max-h-28 overflow-y-auto pr-1">
        {/* All Sources Chip */}
        <button
          type="button"
          onClick={handleSelectAll}
          disabled={disabled}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer select-none",
            isAllSelected
              ? "bg-slate-900 text-white border-slate-900 shadow-xs scale-102"
              : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100"
          )}
        >
          <Layers className="h-3 w-3" />
          <span>All Sources ({readySources.length})</span>
        </button>

        {/* Individual Source Chips */}
        {readySources.map((source) => {
          const isExplicitlyFocused = selectedSourceIds.includes(source.id);

          return (
            <div
              key={source.id}
              onClick={() => handleToggleSource(source.id)}
              className={cn(
                "group flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-medium transition-all cursor-pointer max-w-[240px] select-none",
                isExplicitlyFocused
                  ? "bg-white border-sky-400 text-sky-950 shadow-xs ring-2 ring-sky-400/20 font-bold"
                  : isAllSelected
                  ? "bg-white border-slate-200/90 text-slate-700 hover:border-sky-300 hover:bg-slate-50"
                  : "bg-slate-100/60 border-slate-200 text-slate-400 opacity-60 hover:opacity-100 hover:bg-white hover:border-slate-300"
              )}
              title={source.title}
            >
              {renderSourceIcon(source.type)}
              <span className="truncate">{source.title}</span>

              {isExplicitlyFocused ? (
                <button
                  type="button"
                  onClick={(e) => handleRemoveSource(e, source.id)}
                  className="rounded-full p-0.5 text-sky-700 hover:bg-sky-100 hover:text-sky-900 transition-colors ml-0.5"
                  title="Remove from search focus"
                >
                  <X className="h-3 w-3 stroke-[2.5]" />
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Helpful Hint Subtext */}
      {/* <p className="text-[10px] text-slate-400 px-0.5">
        {isAllSelected
          ? "💡 Tip: Click any source above or in the left library to restrict AI retrieval to specific documents."
          : "🎯 AI answers will strictly and exclusively reference the selected documents above."}
      </p> */}
    </div>
  );
}
