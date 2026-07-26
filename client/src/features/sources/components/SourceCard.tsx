'use client';

import React from 'react';
import { Source } from '@/lib/api/types';
import { SourceStatusBadge } from './SourceStatusBadge';
import { FileText, Globe, AlignLeft, Trash2, ExternalLink, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SourceCardProps {
  source: Source;
  onDelete: (source: Source) => void;
}

export function SourceCard({ source, onDelete }: SourceCardProps) {
  const latestJob = source.ingestionJobs?.[0];
  const isReady = source.status === 'COMPLETED' || source.status === 'READY';
  const isFailed = source.status === 'FAILED' || source.status === 'NEEDS_REVIEW';

  const formattedDate = new Date(source.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedSize = source.fileSize
    ? `${(source.fileSize / (1024 * 1024)).toFixed(2)} MB`
    : null;

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-xl border p-4 transition-all duration-200 bg-card",
        isReady ? "border-brand-dark hover:border-primary shadow-2xs" : "border-brand-dark bg-brand-light/70"
      )}
    >
      <div>
        {/* Header with Type Icon, Badge, and Delete Button */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-medium border border-brand-dark text-foreground">
              {source.type === 'PDF' && <FileText className="h-4 w-4" />}
              {source.type === 'WEBSITE' && <Globe className="h-4 w-4" />}
              {source.type === 'TEXT' && <AlignLeft className="h-4 w-4" />}
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                {source.type}
              </span>
              <h4 className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                {source.title}
              </h4>
            </div>
          </div>

          <button
            onClick={() => onDelete(source)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-brand-medium hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            title="Delete Source"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Source metadata & links */}
        <div className="text-xs text-muted-foreground space-y-1 mb-3">
          {source.type === 'WEBSITE' && source.url && (
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-mono text-[11px] text-foreground hover:underline truncate max-w-full"
            >
              <span className="truncate">{source.url}</span>
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          )}

          {source.type === 'PDF' && formattedSize && (
            <p className="font-mono text-[11px]">PDF Document • {formattedSize}</p>
          )}

          {source.type === 'TEXT' && source.rawText && (
            <p className="line-clamp-2 text-[11px] italic text-muted-foreground bg-brand-light p-2 rounded border border-brand-medium">
              &quot;{source.rawText}&quot;
            </p>
          )}
        </div>

        {/* Ingestion Failure / Reason Alert */}
        {isFailed && (source.statusReason || latestJob?.errorDetails) && (
          <div className="mb-3 rounded-lg bg-brand-medium border border-brand-dark p-2.5 text-xs text-foreground flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="leading-tight">
              <span className="font-bold block mb-0.5">Ingestion Issue:</span>
              <span className="text-[11px]">{source.statusReason || latestJob?.errorDetails}</span>
            </div>
          </div>
        )}
      </div>

      {/* Card Footer with Status Badge */}
      <div className="mt-2 pt-2.5 border-t border-brand-medium flex items-center justify-between text-xs">
        <span className="text-[11px] text-muted-foreground">{formattedDate}</span>
        <SourceStatusBadge
          status={source.status}
          statusReason={source.statusReason}
          latestStage={latestJob?.stage}
        />
      </div>
    </div>
  );
}
