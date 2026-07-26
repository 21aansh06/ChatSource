'use client';

import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CitationItem } from '@/lib/api/types';
import { FileText, Globe, AlignLeft, ExternalLink, Quote, MapPin } from 'lucide-react';

interface CitationInspectorModalProps {
  citation: CitationItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CitationInspectorModal({
  citation,
  isOpen,
  onClose,
}: CitationInspectorModalProps) {
  if (!citation) return null;

  const loc = citation.locationMetadata || {};
  const isPdf = citation.sourceType === 'PDF';
  const isWebsite = citation.sourceType === 'WEBSITE';
  const isText = citation.sourceType === 'TEXT';

  const pdfPage =
    loc.pageNumber !== undefined
      ? String(loc.pageNumber)
      : loc.page !== undefined
      ? String(loc.page)
      : null;

  const websiteUrl = typeof loc.url === 'string' ? loc.url : null;

  const sectionTitle =
    typeof loc.sectionTitle === 'string'
      ? loc.sectionTitle
      : typeof loc.header === 'string'
      ? loc.header
      : null;

  const lineRange =
    loc.lineStart !== undefined
      ? `${loc.lineStart}${loc.lineEnd ? `–${loc.lineEnd}` : ''}`
      : null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Citation [${citation.citationId}]: ${citation.sourceTitle}`}
      description="Ground-truth source excerpt used in model response generation."
    >
      <div className="space-y-4">
        {/* Header Metadata Pill */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-brand-medium p-3 border border-brand-dark text-xs">
          <div className="flex items-center gap-2 font-bold text-foreground">
            {isPdf && <FileText className="h-4 w-4" />}
            {isWebsite && <Globe className="h-4 w-4" />}
            {isText && <AlignLeft className="h-4 w-4" />}
            <span className="uppercase tracking-wider">{citation.sourceType}</span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[11px] text-foreground font-semibold">
            <MapPin className="h-3.5 w-3.5" />
            {isPdf && pdfPage !== null && <span>Page {pdfPage}</span>}
            {isWebsite && sectionTitle && <span>{sectionTitle}</span>}
            {isText && lineRange && <span>Lines {lineRange}</span>}
            {!pdfPage && !sectionTitle && !lineRange && <span>Source Chunk #{citation.chunkId.slice(0, 8)}</span>}
          </div>
        </div>

        {/* Snippet Quote Block */}
        <div className="rounded-xl border border-brand-dark bg-brand-light p-4 text-xs md:text-sm text-foreground space-y-2">
          <div className="flex items-center gap-1.5 text-muted-foreground font-semibold text-xs">
            <Quote className="h-3.5 w-3.5" />
            <span>Retrieved Passage Snippet</span>
          </div>
          <p className="italic leading-relaxed font-sans border-l-2 border-foreground pl-3 py-1">
            &quot;{citation.snippet}&quot;
          </p>
        </div>

        {/* Website Direct Clickable URL Link */}
        {isWebsite && websiteUrl && (
          <div className="rounded-lg bg-card p-3 border border-brand-medium flex items-center justify-between text-xs">
            <span className="font-semibold text-muted-foreground">Original Website URL:</span>
            <a
              href={websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-mono font-bold text-foreground hover:underline"
            >
              <span>Open Link</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}

        {/* PDF / Text Location Details */}
        {isPdf && pdfPage !== null && (
          <div className="rounded-lg bg-card p-3 border border-brand-medium text-xs flex justify-between items-center">
            <span className="font-semibold text-muted-foreground">Document Page:</span>
            <span className="font-mono font-bold text-foreground">Page {pdfPage}</span>
          </div>
        )}

        {isText && lineRange && (
          <div className="rounded-lg bg-card p-3 border border-brand-medium text-xs flex justify-between items-center">
            <span className="font-semibold text-muted-foreground">Source Line Range:</span>
            <span className="font-mono font-bold text-foreground">Lines {lineRange}</span>
          </div>
        )}

        <div className="flex items-center justify-end pt-2 border-t border-brand-medium">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Inspector
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
