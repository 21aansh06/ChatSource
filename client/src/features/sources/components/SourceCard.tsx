'use client';

import React, { useState } from 'react';
import { Source, Quiz } from '@/lib/api/types';
import { SourceStatusBadge } from './SourceStatusBadge';
import {
  FileText,
  Globe,
  AlignLeft,
  Trash2,
  ExternalLink,
  Info,
  Video,
  Check,
  FileCode,
  Sparkles,
  Loader2,
  Trophy,
  Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSourceQuizzesQuery } from '@/features/quizzes/api/use-quizzes';
import { GenerateQuizDialog } from '@/features/quizzes/components/GenerateQuizDialog';
import { QuizPlayerModal } from '@/features/quizzes/components/QuizPlayerModal';

interface SourceCardProps {
  source: Source;
  notebookId?: string;
  onDelete: (source: Source) => void;
  isSelected?: boolean;
  onToggleSelect?: (sourceId: string) => void;
}

export function SourceCard({
  source,
  notebookId,
  onDelete,
  isSelected = true,
  onToggleSelect,
}: SourceCardProps) {
  const currentNotebookId = notebookId || source.notebookId;
  const latestJob = source.ingestionJobs?.[0];
  const isReady = source.status === 'COMPLETED' || source.status === 'READY';
  const isFailed = source.status === 'FAILED' || source.status === 'NEEDS_REVIEW';
  const isPending = source.status === 'PENDING' || source.status === 'PROCESSING';

  // Quizzes integration
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  const { data: quizzes } = useSourceQuizzesQuery(currentNotebookId, source.id);
  const latestQuiz = quizzes?.[0];
  const isGeneratingQuiz =
    latestQuiz?.status === 'PENDING' || latestQuiz?.status === 'GENERATING';
  const hasCompletedQuiz = latestQuiz?.status === 'COMPLETED';
  const latestAttempt = latestQuiz?.attempts?.[0];

  const handleQuizClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasCompletedQuiz) {
      setSelectedQuiz(latestQuiz);
      setIsPlayerOpen(true);
    } else {
      setIsGenerateOpen(true);
    }
  };

  const formattedDate = new Date(source.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedSize = source.fileSize
    ? source.fileSize > 1024 * 1024
      ? `${(source.fileSize / (1024 * 1024)).toFixed(2)} MB`
      : `${(source.fileSize / 1024).toFixed(1)} KB`
    : null;

  return (
    <>
      <div
        className={cn(
          'group relative flex flex-col justify-between rounded-xl border p-3.5 transition-all duration-150 font-sans',
          isReady && isSelected && 'border-slate-200/90 hover:border-sky-300 bg-white hover:shadow-2xs',
          isReady && !isSelected && 'border-slate-200/60 bg-slate-50/40 opacity-70 hover:opacity-100 hover:border-slate-300',
          isFailed && 'border-rose-200 bg-rose-50/30',
          isPending && 'border-amber-200 bg-amber-50/30'
        )}
      >
        <div className="space-y-2">
          {/* Top Header Row with Checkbox, Icon, Title, and Action Buttons */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {isReady && onToggleSelect && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelect(source.id);
                  }}
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-md border transition-all cursor-pointer shrink-0',
                    isSelected
                      ? 'bg-sky-500 border-sky-600 text-white shadow-2xs'
                      : 'bg-white border-slate-300 text-transparent hover:border-sky-400'
                  )}
                  title={isSelected ? 'Active in AI chat (click to exclude)' : 'Excluded from AI chat (click to include)'}
                >
                  <Check className={cn('h-3.5 w-3.5 stroke-[2.5]', isSelected ? 'opacity-100' : 'opacity-0')} />
                </button>
              )}

              <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-slate-700 shrink-0">
                {source.type === 'PDF' && <FileText className="h-4 w-4 text-sky-600" />}
                {source.type === 'MARKDOWN' && <FileCode className="h-4 w-4 text-violet-600" />}
                {source.type === 'WEBSITE' && <Globe className="h-4 w-4 text-emerald-600" />}
                {source.type === 'TEXT' && <AlignLeft className="h-4 w-4 text-indigo-600" />}
                {source.type === 'YOUTUBE' && <Video className="h-4 w-4 text-rose-600" />}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase font-mono block">
                    {source.type}
                  </span>
                  {isReady && (
                    <span
                      className={cn(
                        'text-[9px] font-bold px-1.5 py-0.2 rounded font-mono',
                        isSelected ? 'text-sky-700 bg-sky-50 border border-sky-200/60' : 'text-slate-400 bg-slate-100'
                      )}
                    >
                      {isSelected ? 'Active' : 'Excluded'}
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 group-hover:text-sky-600 transition-colors font-heading">
                  {source.title}
                </h4>
              </div>
            </div>

            <button
              onClick={() => onDelete(source)}
              className="opacity-90 sm:opacity-0 group-hover:opacity-100 rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer shrink-0"
              title="Delete Source"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Source metadata & content previews */}
          <div className="text-xs text-slate-500 space-y-1">
            {(source.type === 'WEBSITE' || source.type === 'YOUTUBE') && source.url && (
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-700 hover:text-sky-600 hover:underline truncate max-w-full"
              >
                <span className="truncate">{source.url}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            )}

            {source.type === 'PDF' && formattedSize && (
              <p className="font-mono text-[11px] text-slate-500">PDF Document • {formattedSize}</p>
            )}

            {source.type === 'TEXT' && source.rawText && (
              <p className="line-clamp-2 text-[11px] italic text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                &quot;{source.rawText}&quot;
              </p>
            )}
          </div>

          {/* Ingestion Failure / Reason Alert */}
          {isFailed && (source.statusReason || latestJob?.errorDetails) && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 flex items-start gap-2 leading-snug">
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <span className="font-bold block text-[11px] font-heading">Ingestion Issue:</span>
                <span className="text-[11px]">{source.statusReason || latestJob?.errorDetails}</span>
              </div>
            </div>
          )}

          {/* Quiz Action Bar (Only for Ready Sources) */}
          {isReady && (
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100/80">
              {isGeneratingQuiz ? (
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/80 animate-pulse">
                  <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
                  <span>Generating Quiz...</span>
                </div>
              ) : hasCompletedQuiz ? (
                <button
                  type="button"
                  onClick={handleQuizClick}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                  title="Click to attempt quiz"
                >
                  <Trophy className="h-3 w-3 text-emerald-600" />
                  <span>
                    {latestAttempt ? `Quiz: ${latestAttempt.score}/${latestAttempt.totalQuestions}` : 'Attempt Quiz'}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleQuizClick}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg border border-sky-200 transition-colors cursor-pointer"
                  title="Generate a new quiz from this source"
                >
                  <Brain className="h-3 w-3 text-sky-600" />
                  <span>Generate Quiz</span>
                </button>
              )}

              {hasCompletedQuiz && (
                <button
                  type="button"
                  onClick={() => setIsGenerateOpen(true)}
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600 hover:underline cursor-pointer"
                  title="Create another quiz variant"
                >
                  + New
                </button>
              )}
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-[11px] font-medium text-slate-400 font-mono">{formattedDate}</span>
          <SourceStatusBadge
            status={source.status}
            statusReason={source.statusReason}
            latestStage={latestJob?.stage}
          />
        </div>
      </div>

      {/* Dialogs */}
      <GenerateQuizDialog
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        notebookId={currentNotebookId}
        sourceId={source.id}
        sourceTitle={source.title}
      />

      <QuizPlayerModal
        isOpen={isPlayerOpen}
        onClose={() => setIsPlayerOpen(false)}
        quiz={selectedQuiz}
        notebookId={currentNotebookId}
      />
    </>
  );
}
