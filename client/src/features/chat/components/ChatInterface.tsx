'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQueryClient } from '@tanstack/react-query';
import {
  useChatSessionsQuery,
  useChatSessionQuery,
  useAskQuestionMutation,
  CHAT_HISTORY_QUERY_KEY,
  CHAT_SESSIONS_QUERY_KEY,
} from '../api/use-chat';
import { ChatMessageItem } from './ChatMessageItem';
import { ChatInput } from './ChatInput';
import { CitationItem, ChatMessage, SSEChatEvent } from '@/lib/api/types';
import { apiClient } from '@/lib/api/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { MessageSquare, Sparkles, AlertCircle, RefreshCw, Plus } from 'lucide-react';

interface ChatInterfaceProps {
  notebookId: string;
  hasReadySources: boolean;
}

export function ChatInterface({ notebookId, hasReadySources }: ChatInterfaceProps) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Live SSE Streaming State
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingUserMessage, setStreamingUserMessage] = useState<string | null>(null);
  const [streamingAssistantContent, setStreamingAssistantContent] = useState('');
  const [streamingCitations, setStreamingCitations] = useState<CitationItem[]>([]);
  const [streamingIsLowConfidence, setStreamingIsLowConfidence] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [preStreamMessageCount, setPreStreamMessageCount] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: sessions, isLoading: isLoadingSessions } = useChatSessionsQuery(notebookId);
  const { data: sessionData, isLoading: isLoadingHistory, isError, refetch } = useChatSessionQuery(
    notebookId,
    activeSessionId
  );

  const askMutation = useAskQuestionMutation(notebookId);

  // Auto-select first session if available and activeSessionId not set
  useEffect(() => {
    if (sessions && sessions.length > 0 && !activeSessionId) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, activeSessionId]);

  // Clear temporary streaming buffer once persisted history catches up with newly added messages
  useEffect(() => {
    if (
      preStreamMessageCount !== null &&
      sessionData?.messages &&
      sessionData.messages.length > preStreamMessageCount
    ) {
      setStreamingUserMessage(null);
      setStreamingAssistantContent('');
      setStreamingCitations([]);
      setPreStreamMessageCount(null);
    }
  }, [sessionData?.messages, preStreamMessageCount]);

  // Scroll to bottom when messages or streaming text updates
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessionData?.messages, streamingAssistantContent, isStreaming]);

  // Stream consumer function using native fetch ReadableStream decoder
  const consumeStream = async (streamUrl: string, targetSessionId: string) => {
    try {
      const token = await getToken();
      const response = await fetch(streamUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error(`Failed to establish stream: HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('ReadableStream not supported by browser');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            try {
              const event: SSEChatEvent = JSON.parse(dataStr);

              if (event.type === 'token') {
                setStreamingAssistantContent((prev) => prev + event.payload.token);
              } else if (event.type === 'citations') {
                setStreamingCitations(event.payload.citations || []);
              } else if (event.type === 'complete') {
                if (event.payload.isLowConfidence) {
                  setStreamingIsLowConfidence(true);
                }
                setIsStreaming(false);

                // Reconcile client state with backend database history
                queryClient.invalidateQueries({
                  queryKey: [...CHAT_HISTORY_QUERY_KEY, notebookId, targetSessionId],
                });
                queryClient.invalidateQueries({
                  queryKey: [...CHAT_SESSIONS_QUERY_KEY, notebookId],
                });
              } else if (event.type === 'error') {
                setStreamError(event.payload.error || 'Generation error occurred.');
                setIsStreaming(false);
                queryClient.invalidateQueries({
                  queryKey: [...CHAT_HISTORY_QUERY_KEY, notebookId, targetSessionId],
                });
              }
            } catch (err) {
              console.error('Failed to parse SSE JSON chunk:', err);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('SSE Stream Connection Error:', err);
      setStreamError(err?.message || 'Connection lost during streaming.');
      setIsStreaming(false);
      if (targetSessionId) {
        queryClient.invalidateQueries({
          queryKey: [...CHAT_HISTORY_QUERY_KEY, notebookId, targetSessionId],
        });
      }
    }
  };

  const handleSendMessage = async (userText: string) => {
    const currentCount = sessionData?.messages?.length || 0;
    setPreStreamMessageCount(currentCount);

    setIsStreaming(true);
    setStreamingUserMessage(userText);
    setStreamingAssistantContent('');
    setStreamingCitations([]);
    setStreamingIsLowConfidence(false);
    setStreamError(null);

    try {
      const askResult = await askMutation.mutateAsync({
        message: userText,
        sessionId: activeSessionId || undefined,
      });

      const currentSessionId = askResult.sessionId;
      if (!activeSessionId) {
        setActiveSessionId(currentSessionId);
      }

      const fullStreamUrl = askResult.streamUrl.startsWith('http')
        ? askResult.streamUrl
        : apiClient.chat.getStreamUrl(notebookId, currentSessionId);

      await consumeStream(fullStreamUrl, currentSessionId);
    } catch (err: any) {
      console.error('Failed to ask question:', err);
      setStreamError(err?.message || 'Failed to submit question.');
      setIsStreaming(false);
    }
  };

  const handleStartNewSession = () => {
    setActiveSessionId(null);
    setStreamingUserMessage(null);
    setStreamingAssistantContent('');
    setStreamingCitations([]);
    setStreamError(null);
    setPreStreamMessageCount(null);
  };

  const persistedMessages: ChatMessage[] = sessionData?.messages || [];

  // Keep streaming bubble visible while streaming OR while waiting for refetched history to arrive
  const showStreamingAssistantBubble =
    isStreaming ||
    (streamingAssistantContent !== '' &&
      preStreamMessageCount !== null &&
      persistedMessages.length <= preStreamMessageCount);

  const showStreamingUserBubble =
    streamingUserMessage !== null &&
    (isStreaming ||
      (preStreamMessageCount !== null && persistedMessages.length <= preStreamMessageCount));

  return (
    <div className="flex flex-col h-[600px] rounded-xl border border-brand-medium bg-card shadow-xs overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-brand-medium bg-brand-light">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-medium border border-brand-dark text-foreground">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground leading-none">Notebook Chat</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {sessionData?.title || 'Notebook-Scoped Grounded Chat'}
            </p>
          </div>
        </div>

        <Button
          onClick={handleStartNewSession}
          variant="outline"
          size="sm"
          disabled={isStreaming}
          className="gap-1 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Chat</span>
        </Button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-brand-light/30">
        {/* Loading History Skeleton */}
        {isLoadingHistory && activeSessionId && (
          <div className="space-y-4">
            <Skeleton className="h-16 w-3/4 ml-auto rounded-xl" />
            <Skeleton className="h-28 w-4/5 rounded-xl" />
          </div>
        )}

        {/* History Fetch Error */}
        {isError && (
          <div className="rounded-xl border border-brand-dark bg-brand-medium/50 p-6 text-center space-y-3 my-4">
            <AlertCircle className="h-6 w-6 mx-auto text-foreground" />
            <p className="text-xs text-muted-foreground">Failed to load session history.</p>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2 mx-auto">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingHistory && persistedMessages.length === 0 && !isStreaming && !showStreamingAssistantBubble && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3 my-auto">
            <div className="h-12 w-12 rounded-2xl bg-brand-medium border border-brand-dark flex items-center justify-center text-foreground shadow-2xs">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h4 className="font-bold text-sm text-foreground">Ask Anything About Your Sources</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Queries search across all ready notebook sources simultaneously and return streaming answers backed by location citations.
              </p>
            </div>
          </div>
        )}

        {/* Persisted History Messages */}
        {persistedMessages.map((msg) => (
          <ChatMessageItem key={msg.id} message={msg} />
        ))}

        {/* Live Streaming or Transitioning User Message Bubble */}
        {showStreamingUserBubble && streamingUserMessage && (
          <ChatMessageItem role="USER" content={streamingUserMessage} />
        )}

        {/* Live Streaming or Transitioning Assistant Message Bubble */}
        {showStreamingAssistantBubble && (
          <ChatMessageItem
            role="ASSISTANT"
            content={streamingAssistantContent}
            citations={streamingCitations}
            isStreaming={isStreaming}
            isLowConfidence={streamingIsLowConfidence}
            streamError={streamError}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 border-t border-brand-medium bg-card">
        <ChatInput
          onSend={handleSendMessage}
          isStreaming={isStreaming}
          hasReadySources={hasReadySources}
        />
      </div>
    </div>
  );
}
