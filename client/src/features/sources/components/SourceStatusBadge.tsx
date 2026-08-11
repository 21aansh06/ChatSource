'use client';

import React from 'react';
import { IngestionStatus } from '@/lib/api/types';
import { Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SourceStatusBadgeProps {
  status: IngestionStatus | string;
  statusReason?: string | null;
  latestStage?: string;
  className?: string;
}

export function SourceStatusBadge({
  status,
  statusReason,
  latestStage,
  className,
}: SourceStatusBadgeProps) {
  const normalizedStatus = String(status).toUpperCase();

  if (normalizedStatus === 'COMPLETED' || normalizedStatus === 'READY') {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs",
          className
        )}
        title="Ready to be queried in notebook chat"
      >
        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
        <span>Ready</span>
      </span>
    );
  }

  if (normalizedStatus === 'PENDING' || normalizedStatus === 'PROCESSING') {
    const stageInfo = latestStage ? `Stage: ${latestStage}. ` : '';
    const processingTitle = `Status: ${normalizedStatus}. ${stageInfo}Source is chunking/embedding...`;

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse",
          className
        )}
        title={processingTitle}
      >
        <Loader2 className="h-3 w-3 animate-spin text-amber-600" />
        <span>{latestStage ? `Processing (${latestStage})` : 'Processing...'}</span>
      </span>
    );
  }

  if (normalizedStatus === 'FAILED' || normalizedStatus === 'NEEDS_REVIEW') {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200",
          className
        )}
        title={statusReason || 'Ingestion failed or requires review'}
      >
        <AlertCircle className="h-3 w-3 text-rose-600" />
        <span>{normalizedStatus === 'NEEDS_REVIEW' ? 'Needs Review' : 'Failed'}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600",
        className
      )}
    >
      <Clock className="h-3 w-3" />
      <span>{normalizedStatus}</span>
    </span>
  );
}
