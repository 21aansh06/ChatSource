'use client';

import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useGenerateQuizMutation } from '../api/use-quizzes';
import { QuizDifficulty } from '@/lib/api/types';
import { Sparkles, Brain, Loader2, Gauge, HelpCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GenerateQuizDialogProps {
  isOpen: boolean;
  onClose: () => void;
  notebookId: string;
  sourceId: string;
  sourceTitle: string;
}

export function GenerateQuizDialog({
  isOpen,
  onClose,
  notebookId,
  sourceId,
  sourceTitle,
}: GenerateQuizDialogProps) {
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('MEDIUM');
  const [provider, setProvider] = useState<'openai' | 'gemini'>('openai');

  const generateMutation = useGenerateQuizMutation(notebookId, sourceId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateMutation.mutate(
      {
        questionCount,
        difficulty,
        provider,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Generate AI Active-Recall Quiz"
      description={`Generate a personalized self-assessment quiz derived strictly from "${sourceTitle}".`}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Number of Questions */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Number of Questions
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[3, 5, 8, 10].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setQuestionCount(count)}
                className={cn(
                  'flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer',
                  questionCount === count
                    ? 'border-sky-500 bg-sky-50 text-sky-700 ring-2 ring-sky-200'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <span className="text-sm font-extrabold">{count}</span>
                <span className="text-[10px] text-slate-400 font-medium">Questions</span>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Level */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Target Difficulty
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { level: 'EASY', desc: 'Direct recall' },
                { level: 'MEDIUM', desc: 'Comprehension' },
                { level: 'HARD', desc: 'Deep synthesis' },
              ] as const
            ).map(({ level, desc }) => (
              <button
                key={level}
                type="button"
                onClick={() => setDifficulty(level)}
                className={cn(
                  'flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer',
                  difficulty === level
                    ? 'border-sky-500 bg-sky-50 text-sky-700 ring-2 ring-sky-200'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                )}
              >
                <span className="text-xs font-extrabold">{level}</span>
                <span className="text-[10px] text-slate-400 font-medium mt-0.5">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Model Provider Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            AI Model Engine
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setProvider('openai')}
              className={cn(
                'flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer',
                provider === 'openai'
                  ? 'border-sky-500 bg-sky-50 text-sky-700 ring-2 ring-sky-200'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              <Sparkles className="h-4 w-4 text-emerald-500 shrink-0" />
              <div className="text-left">
                <div className="font-bold">OpenAI Structured</div>
                <div className="text-[10px] text-slate-400 font-normal">GPT-4o Mini (Strict JSON)</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setProvider('gemini')}
              className={cn(
                'flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer',
                provider === 'gemini'
                  ? 'border-sky-500 bg-sky-50 text-sky-700 ring-2 ring-sky-200'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              <Brain className="h-4 w-4 text-violet-500 shrink-0" />
              <div className="text-left">
                <div className="font-bold">Google Gemini</div>
                <div className="text-[10px] text-slate-400 font-normal">Gemini 3.8 Flash</div>
              </div>
            </button>
          </div>
        </div>

        {/* Information Callout */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 flex items-start gap-2.5">
          <HelpCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Quiz generation runs as an <span className="font-semibold text-slate-900">asynchronous background job</span>. Stratified sampling will extract representative anchor points across the entire document so every chapter is fairly tested.
          </p>
        </div>

        {/* Error message */}
        {generateMutation.isError && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
            {generateMutation.error instanceof Error
              ? generateMutation.error.message
              : 'Failed to initiate quiz generation.'}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={generateMutation.isPending}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={generateMutation.isPending}
            className="text-xs bg-sky-600 hover:bg-sky-700 text-white gap-2 font-bold shadow-xs cursor-pointer"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Enqueuing Job...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Generate Quiz</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
