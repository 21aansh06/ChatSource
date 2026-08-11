'use client';

import React, { useState } from 'react';
import { CitationItem } from '@/lib/api/types';
import { CitationInspectorModal } from './CitationInspectorModal';
import { FileText, Globe, AlignLeft, ExternalLink, Bookmark } from 'lucide-react';

interface CitationListProps {
  citations: CitationItem[];
}

export function CitationList({ citations }: CitationListProps) {
  const [selectedCitation, setSelectedCitation] = useState<CitationItem | null>(null);

  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 font-heading">
        <Bookmark className="h-3.5 w-3.5 text-amber-500" />
        <span>Verifiable Ground-Truth Proof ({citations.length}):</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {citations.map((c, idx) => {
          const isPdf = c.sourceType === 'PDF';
          const isWebsite = c.sourceType === 'WEBSITE';
          const isText = c.sourceType === 'TEXT';

          const loc = c.locationMetadata || {};
          const pdfPage =
            loc.pageNumber !== undefined
              ? String(loc.pageNumber)
              : loc.page !== undefined
              ? String(loc.page)
              : null;

          const websiteUrl = typeof loc.url === 'string' ? loc.url : null;
          const lineRange =
            loc.lineStart !== undefined
              ? `${loc.lineStart}${loc.lineEnd ? `–${loc.lineEnd}` : ''}`
              : null;

          return (
            <div
              key={c.citationId || c.chunkId || idx}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50 px-2.5 py-1 text-xs text-slate-800 transition-all hover:bg-sky-50 hover:border-sky-300 shadow-2xs group"
            >
              {/* Citation Index Badge */}
              <span className="font-mono font-extrabold text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 border border-amber-500/20">
                [{c.citationId}]
              </span>

              {/* Source Icon */}
              {isPdf && <FileText className="h-3.5 w-3.5 shrink-0 text-sky-600" />}
              {isWebsite && <Globe className="h-3.5 w-3.5 shrink-0 text-emerald-600" />}
              {isText && <AlignLeft className="h-3.5 w-3.5 shrink-0 text-indigo-600" />}

              {/* Source Title & Location */}
              <button
                onClick={() => setSelectedCitation(c)}
                className="font-semibold hover:underline text-left truncate max-w-[180px] focus-visible:outline-none cursor-pointer text-slate-800 group-hover:text-sky-700"
                title={`Click to inspect citation snippet from ${c.sourceTitle}`}
              >
                <span className="truncate">{c.sourceTitle}</span>
                {isPdf && pdfPage !== null && (
                  <span className="ml-1 font-mono text-[10px] text-slate-500 font-bold">
                    (p. {pdfPage})
                  </span>
                )}
                {isText && lineRange && (
                  <span className="ml-1 font-mono text-[10px] text-slate-500 font-bold">
                    (L {lineRange})
                  </span>
                )}
              </button>

              {/* Direct Clickable Website External Link */}
              {isWebsite && websiteUrl && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded p-0.5 hover:bg-white transition-colors text-slate-500 hover:text-sky-600"
                  title="Open external website link directly"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          );
        })}
      </div>

      <CitationInspectorModal
        citation={selectedCitation}
        isOpen={Boolean(selectedCitation)}
        onClose={() => setSelectedCitation(null)}
      />
    </div>
  );
}
