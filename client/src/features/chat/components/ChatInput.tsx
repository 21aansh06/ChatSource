'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Info } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isStreaming: boolean;
  hasReadySources: boolean;
}

export function ChatInput({ onSend, isStreaming, hasReadySources }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isStreaming && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isStreaming]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming || !hasReadySources) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 font-sans">
      {/* Notice if zero ready sources exist */}
      {!hasReadySources && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0 text-amber-600" />
          <span>Add at least one ready source to the notebook to enable grounded AI chat.</span>
        </div>
      )}

      {/* Input container */}
      <div className="relative flex items-center rounded-2xl border border-slate-200 bg-white shadow-2xs focus-within:ring-2 focus-within:ring-sky-500 focus-within:border-sky-500 transition-all">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            hasReadySources
              ? "Ask a question about your notebook sources... (Press Enter to send, Shift+Enter for newline)"
              : "Ingest sources above to start chatting..."
          }
          rows={2}
          disabled={isStreaming || !hasReadySources}
          className="w-full resize-none bg-transparent px-4 py-3 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 text-slate-900 leading-relaxed font-sans"
        />

        <div className="pr-3">
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || isStreaming || !hasReadySources}
            className="h-9 w-9 p-0 rounded-xl shrink-0 shadow-xs"
            title="Send Message"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
            ) : (
              <Send className="h-4 w-4 text-sky-400" />
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
