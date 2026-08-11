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
      <div className="space-y-4 font-sans">
        {/* Header Metadata Pill */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-900 text-white p-3.5 border border-slate-800 text-xs shadow-xs">
          <div className="flex items-center gap-2 font-bold font-heading">
            {isPdf && <FileText className="h-4 w-4 text-sky-400" />}
            {isWebsite && <Globe className="h-4 w-4 text-emerald-400" />}
            {isText && <AlignLeft className="h-4 w-4 text-indigo-400" />}
            <span className="uppercase tracking-wider text-[11px] font-mono">{citation.sourceType}</span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[11px] text-amber-300 font-semibold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg">
            <MapPin className="h-3.5 w-3.5" />
            {isPdf && pdfPage !== null && <span>Page {pdfPage}</span>}
            {isWebsite && sectionTitle && <span>{sectionTitle}</span>}
            {isText && lineRange && <span>Lines {lineRange}</span>}
            {!pdfPage && !sectionTitle && !lineRange && <span>Source Chunk #{citation.chunkId.slice(0, 8)}</span>}
          </div>
        </div>

        {/* Snippet Quote Block */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs sm:text-sm text-slate-800 space-y-2.5">
          <div className="flex items-center gap-1.5 text-slate-500 font-bold text-xs font-heading">
            <Quote className="h-3.5 w-3.5 text-sky-600" />
            <span>Retrieved Source Passage Snippet</span>
          </div>
          <p className="italic leading-relaxed font-sans border-l-2 border-sky-500 pl-3.5 py-1 text-slate-700">
            &quot;{citation.snippet}&quot;
          </p>
        </div>

        {/* Website Direct Clickable URL Link */}
        {isWebsite && websiteUrl && (
          <div className="rounded-xl bg-white p-3 border border-slate-200 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-500 font-heading">Original Website URL:</span>
            <a
              href={websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-mono font-bold text-sky-600 hover:underline"
            >
              <span>Open Link</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}

        {/* PDF / Text Location Details */}
        {isPdf && pdfPage !== null && (
          <div className="rounded-xl bg-white p-3 border border-slate-200 text-xs flex justify-between items-center">
            <span className="font-semibold text-slate-500 font-heading">Document Page:</span>
            <span className="font-mono font-bold text-slate-900">Page {pdfPage}</span>
          </div>
        )}

        {isText && lineRange && (
          <div className="rounded-xl bg-white p-3 border border-slate-200 text-xs flex justify-between items-center">
            <span className="font-semibold text-slate-500 font-heading">Source Line Range:</span>
            <span className="font-mono font-bold text-slate-900">Lines {lineRange}</span>
          </div>
        )}

        <div className="flex items-center justify-end pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Inspector
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
