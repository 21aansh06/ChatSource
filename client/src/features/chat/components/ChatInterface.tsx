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
import { MessageSquare, Sparkles, AlertCircle, RefreshCw, Plus, ShieldCheck, ArrowRight, Lightbulb, Compass } from 'lucide-react';

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

  const persistedMessages: ChatMessage[] = sessionData?.messages || [];

  // Check if persisted history has received the newly saved Assistant message
  const lastPersistedMessage = persistedMessages[persistedMessages.length - 1];
  const hasAssistantMessagePersisted = lastPersistedMessage?.role === 'ASSISTANT';

  // Clear temporary streaming buffer ONLY when the persisted history contains the new Assistant message
  useEffect(() => {
    if (!isStreaming && hasAssistantMessagePersisted && streamingAssistantContent !== '') {
      setStreamingUserMessage(null);
      setStreamingAssistantContent('');
      setStreamingCitations([]);
      setStreamingIsLowConfidence(false);
    }
  }, [isStreaming, hasAssistantMessagePersisted, streamingAssistantContent]);

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
  };

  // User bubble rendering logic
  const isUserMessagePersisted = persistedMessages.some(
    (m) => m.role === 'USER' && m.content === streamingUserMessage
  );
  const showStreamingUserBubble = streamingUserMessage !== null && !isUserMessagePersisted;

  // Assistant bubble rendering logic
  const showStreamingAssistantBubble =
    isStreaming || (streamingAssistantContent !== '' && !hasAssistantMessagePersisted);

  // Suggested Starter Prompts
  const suggestedPrompts = [
    { title: 'Executive Summary', prompt: 'Provide a concise executive summary of all uploaded materials.' },
    { title: 'Key Takeaways & Findings', prompt: 'What are the top 3-5 core conclusions and takeaways discussed in the sources?' },
    { title: 'Technical Glossary', prompt: 'Define the main technical terms, formulas, or concepts mentioned across the sources.' }
  ];

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden font-sans">
      {/* Studio Chat Header (Shrink-0) */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white shadow-2xs">
            <Sparkles className="h-4 w-4 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 leading-none font-heading">
                Grounded Chat Studio
              </h3>
              {hasReadySources && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-mono flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" />
                  Grounded
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {sessionData?.title || 'Notebook-Scoped Session'}
            </p>
          </div>
        </div>

        {/* <Button
          onClick={handleStartNewSession}
          variant="outline"
          size="sm"
          disabled={isStreaming}
          className="gap-1 px-2.5 py-1 text-xs font-semibold shadow-2xs cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5 text-sky-600" />
          <span>New Session</span>
        </Button> */}
      </div>

      {/* Messages Scroll Area (Flex-1 Overflow-Y-Auto Internal Scroll Only) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/20 min-h-0">
        {/* Loading History Skeleton */}
        {isLoadingHistory && activeSessionId && (
          <div className="space-y-4">
            <Skeleton className="h-14 w-3/4 ml-auto rounded-2xl" />
            <Skeleton className="h-24 w-4/5 rounded-2xl" />
          </div>
        )}

        {/* History Fetch Error */}
        {isError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5 text-center space-y-3 my-4">
            <AlertCircle className="h-5 w-5 mx-auto text-rose-600" />
            <p className="text-xs text-slate-600">Failed to load session history.</p>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2 mx-auto text-xs">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </Button>
          </div>
        )}

        {/* Studio Empty State with Suggestion Cards */}
        {!isLoadingHistory && persistedMessages.length === 0 && !isStreaming && !showStreamingAssistantBubble && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-6 my-auto">
            <div className="space-y-2 max-w-md">
              <div className="h-12 w-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 mx-auto shadow-2xs">
                <Compass className="h-6 w-6" />
              </div>
              <h4 className="font-extrabold text-base sm:text-lg text-slate-900 font-heading">
                Understand your sources with grounded AI
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ask questions across all ingested PDF documents, website links, or notes simultaneously. Every answer includes verifiable location citations.
              </p>
            </div>

            {/* Starter Suggestion Cards */}
            {hasReadySources && (
              <div className="w-full max-w-lg space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-400 font-heading uppercase tracking-wider">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                  <span>Suggested Quick Starters:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
                  {suggestedPrompts.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(item.prompt)}
                      disabled={isStreaming}
                      className="group p-3 rounded-xl bg-white border border-slate-200/90 hover:border-sky-300 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <span className="font-bold text-xs text-slate-900 block font-heading group-hover:text-sky-600 transition-colors">
                          {item.title}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                          {item.prompt}
                        </p>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <ArrowRight className="h-3 w-3 text-slate-300 group-hover:text-sky-500 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Persisted History Messages */}
        {persistedMessages.map((msg) => (
          <ChatMessageItem key={msg.id} message={msg} />
        ))}

        {/* Live Streaming User Bubble */}
        {showStreamingUserBubble && streamingUserMessage && (
          <ChatMessageItem role="USER" content={streamingUserMessage} />
        )}

        {/* Live Streaming Assistant Bubble */}
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

      {/* Studio Input Area (Shrink-0) */}
      <div className="p-4 border-t border-slate-100 bg-white shrink-0">
        <ChatInput
          onSend={handleSendMessage}
          isStreaming={isStreaming}
          hasReadySources={hasReadySources}
        />
      </div>
    </div>
  );
}
