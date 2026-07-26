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
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-primary text-primary-foreground shadow-2xs",
          className
        )}
        title="Ready to be queried in notebook chat"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>Ready</span>
      </span>
    );
  }

  if (normalizedStatus === 'PENDING' || normalizedStatus === 'PROCESSING') {
    const stageInfo = latestStage ? `Stage: ${latestStage}. ` : '';
    const processingTitle = `Status: ${normalizedStatus}. ${stageInfo}Source is chunking/embedding and not usable for chat yet.`;

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-brand-medium border border-brand-dark text-foreground animate-pulse",
          className
        )}
        title={processingTitle}
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>{latestStage ? `Ingesting (${latestStage})` : 'Processing...'}</span>
      </span>
    );
  }

  if (normalizedStatus === 'FAILED' || normalizedStatus === 'NEEDS_REVIEW') {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-brand-dark border border-foreground text-foreground",
          className
        )}
        title={statusReason || 'Ingestion failed or requires review'}
      >
        <AlertCircle className="h-3.5 w-3.5" />
        <span>{normalizedStatus === 'NEEDS_REVIEW' ? 'Needs Review' : 'Ingestion Failed'}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-brand-medium text-foreground",
        className
      )}
    >
      <Clock className="h-3.5 w-3.5" />
      <span>{normalizedStatus}</span>
    </span>
  );
}
