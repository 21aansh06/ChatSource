'use client';

import React from 'react';
import { ChatMessage, CitationItem } from '@/lib/api/types';
import { CitationList } from './CitationList';
import { Bot, User, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessageItemProps {
  message?: ChatMessage;
  // Streaming state overrides for live-updating streaming message
  role?: 'USER' | 'ASSISTANT';
  content?: string;
  citations?: CitationItem[];
  isStreaming?: boolean;
  isLowConfidence?: boolean;
  streamError?: string | null;
}

export function ChatMessageItem({
  message,
  role: roleProp,
  content: contentProp,
  citations: citationsProp,
  isStreaming = false,
  isLowConfidence: lowConfidenceProp = false,
  streamError = null,
}: ChatMessageItemProps) {
  const role = message?.role || roleProp || 'ASSISTANT';
  const content = message?.content || contentProp || '';
  const citations = message?.citations || citationsProp || [];
  const isUser = role === 'USER';

  // Check if content indicates low confidence fallback
  const isLowConf =
    lowConfidenceProp ||
    content.includes("couldn't find sufficient information") ||
    content.includes("could not find sufficient information");

  return (
    <div
      className={cn(
        "flex gap-3 p-4 rounded-xl border transition-all duration-200",
        isUser
          ? "bg-brand-medium border-brand-dark ml-8 sm:ml-16 shadow-xs"
          : "bg-card border-brand-medium mr-4 sm:mr-12 shadow-xs"
      )}
    >
      {/* Avatar Icon */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-foreground font-semibold text-xs shadow-2xs",
          isUser ? "bg-card border-brand-dark" : "bg-brand-medium border-brand-dark"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Message Content Body */}
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-foreground">
            {isUser ? 'You' : 'NotebookLM Assistant'}
          </span>
          {isStreaming && (
            <span className="text-[11px] font-semibold text-muted-foreground animate-pulse flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-foreground animate-ping inline-block" />
              Streaming response...
            </span>
          )}
        </div>

        {/* Message Text with Streaming Cursor Indicator */}
        <div className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap font-sans">
          {content}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-0.5 bg-foreground animate-pulse align-middle" />
          )}
        </div>

        {/* Stream Error Alert Box */}
        {streamError && (
          <div className="rounded-lg bg-brand-medium border border-brand-dark p-3 text-xs text-foreground flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-foreground" />
            <div>
              <p className="font-bold">Generation Error</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{streamError}</p>
            </div>
          </div>
        )}

        {/* Low Confidence Warning Box */}
        {!isUser && isLowConf && !isStreaming && (
          <div className="rounded-lg bg-brand-medium border border-brand-dark p-3 text-xs text-foreground flex items-start gap-2.5 mt-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="leading-tight">
              <p className="font-bold">Low Confidence Notice</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                The model could not verify sufficient supporting details in your notebook sources for this answer.
              </p>
            </div>
          </div>
        )}

        {/* Citations List */}
        {!isUser && citations.length > 0 && (
          <CitationList citations={citations} />
        )}
      </div>
    </div>
  );
}
