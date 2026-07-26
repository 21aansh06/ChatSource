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
    <form onSubmit={handleSubmit} className="space-y-2">
      {/* Notice if zero ready sources exist */}
      {!hasReadySources && (
        <div className="rounded-lg bg-brand-medium border border-brand-dark p-2.5 text-xs text-foreground flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0" />
          <span>Add at least one ready source to the notebook to enable grounded AI chat.</span>
        </div>
      )}

      {/* Input container */}
      <div className="relative flex items-center rounded-xl border border-brand-dark bg-card shadow-xs focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
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
          className="w-full resize-none bg-transparent px-4 py-3 text-xs sm:text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
        />

        <div className="pr-3">
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || isStreaming || !hasReadySources}
            className="h-8 w-8 p-0 rounded-lg shrink-0"
            title="Send Message"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
