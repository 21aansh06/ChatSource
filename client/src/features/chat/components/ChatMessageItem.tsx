'use client';

import React from 'react';
import { ChatMessage, CitationItem } from '@/lib/api/types';
import { CitationList } from './CitationList';
import { Bot, User, AlertTriangle, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
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

export const ChatMessageItem = React.memo(function ChatMessageItem({
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

  // Check if content or stream error indicates a limit reached
  const isContentLimitReached =
    content.toLowerCase().includes('limit reached') ||
    content.toLowerCase().includes('plan limit') ||
    content.toLowerCase().includes('upgrade to a paid plan');

  const isStreamErrorLimitReached = Boolean(
    streamError &&
      (streamError.toLowerCase().includes('limit') ||
        streamError.toLowerCase().includes('429') ||
        streamError.toLowerCase().includes('plan'))
  );

  return (
    <div
      className={cn(
        "flex gap-3 p-4 rounded-2xl border transition-all duration-200 font-sans",
        isUser
          ? "bg-slate-900 border-slate-800 text-white ml-8 sm:ml-16 shadow-xs"
          : "bg-white border-slate-200/90 text-slate-900 mr-4 sm:mr-12 shadow-2xs"
      )}
    >
      {/* Avatar Icon */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-semibold text-xs shadow-2xs",
          isUser ? "bg-slate-800 border border-slate-700 text-sky-400" : "bg-sky-50 border border-sky-100 text-sky-600"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>

      {/* Message Content Body */}
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("text-xs font-bold font-heading", isUser ? "text-slate-200" : "text-slate-900")}>
            {isUser ? 'You' : 'ChatSource Assistant'}
          </span>
          {isStreaming && (
            <span className="text-[11px] font-semibold text-sky-600 animate-pulse flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-sky-500 animate-ping inline-block" />
              Streaming answer...
            </span>
          )}
        </div>

        {/* Message Text with Streaming Cursor Indicator */}
        <div className={cn("text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans", isUser ? "text-slate-100" : "text-slate-700")}>
          {content}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-0.5 bg-sky-500 animate-pulse align-middle rounded-xs" />
          )}
        </div>

        {/* Contact Link when Content indicates Limit reached */}
        {!isUser && isContentLimitReached && (
          <div className="pt-1.5">
            <a
              href="mailto:axnsh@gmail.com?subject=ChatSource%20Plan%20Upgrade%20-%20Query%20Limit%20Reached"
              className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline cursor-pointer"
            >
              <span>Contact</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        )}

        {/* Stream Error Alert Box */}
        {streamError && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <p className="font-bold font-heading">Generation Error</p>
                <p className="text-[11px] text-rose-600 mt-0.5">{streamError}</p>
              </div>
            </div>
            {isStreamErrorLimitReached && (
              <div className="pl-6.5">
                <a
                  href="mailto:support@chatsource.com?subject=ChatSource%20Plan%20Upgrade%20-%20Query%20Limit%20Reached"
                  className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-800 hover:underline cursor-pointer"
                >
                  <span>Contact</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Low Confidence Warning Box */}
        {!isUser && isLowConf && !isStreaming && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex items-start gap-2.5 mt-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <div className="leading-tight">
              <p className="font-bold font-heading">Low Confidence Notice</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
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
});
