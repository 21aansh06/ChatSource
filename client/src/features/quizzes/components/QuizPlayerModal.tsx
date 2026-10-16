'use client';

import React, { useState, useEffect } from 'react';
import { Quiz, QuizQuestion, QuestionGradedBreakdown } from '@/lib/api/types';
import { useSubmitQuizAttemptMutation } from '../api/use-quizzes';
import {
  X,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Trophy,
  Award,
  Sparkles,
  BookOpen,
  ArrowRight,
  Loader2,
  Compass,
  Brain,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuizPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: Quiz | null;
  notebookId: string;
}

export function QuizPlayerModal({
  isOpen,
  onClose,
  quiz,
  notebookId,
}: QuizPlayerModalProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [revealedQuestions, setRevealedQuestions] = useState<Record<string, boolean>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [startTime] = useState<number>(() => Date.now());
  const [submissionResult, setSubmissionResult] = useState<{
    score: number;
    total: number;
    percentage: number;
    breakdown: QuestionGradedBreakdown[];
  } | null>(null);

  const submitMutation = useSubmitQuizAttemptMutation(notebookId, quiz?.id || '');

  // Reset state when a new quiz opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setSelectedAnswers({});
      setRevealedQuestions({});
      setIsCompleted(false);
      setSubmissionResult(null);
    }
  }, [isOpen, quiz?.id]);

  if (!isOpen || !quiz) return null;

  const questions = (quiz.questions as unknown as QuizQuestion[]) || [];
  const currentQuestion = questions[currentIndex];
  const total = questions.length;
  const progressPct = total > 0 ? Math.round(((currentIndex + 1) / total) * 100) : 0;

  const handleSelectOption = (optionIndex: number) => {
    if (!currentQuestion) return;
    if (revealedQuestions[currentQuestion.id]) return; // locked once revealed

    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }));
  };

  const handleRevealAnswer = () => {
    if (!currentQuestion) return;
    setRevealedQuestions((prev) => ({
      ...prev,
      [currentQuestion.id]: true,
    }));
  };

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleFinishQuiz();
    }
  };

  const handleFinishQuiz = () => {
    const timeSpentSec = Math.round((Date.now() - startTime) / 1000);
    submitMutation.mutate(
      {
        answers: selectedAnswers,
        timeSpentSec,
      },
      {
        onSuccess: (data) => {
          setSubmissionResult({
            score: data.score,
            total: data.totalQuestions,
            percentage: data.percentage,
            breakdown: data.breakdown,
          });
          setIsCompleted(true);
        },
      }
    );
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setRevealedQuestions({});
    setCurrentIndex(0);
    setIsCompleted(false);
    setSubmissionResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Body */}
      <div className="relative z-50 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden font-sans">
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
              <Brain className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-600 font-mono">
                  {quiz.difficulty} Active Recall
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500 truncate max-w-[200px]">
                  {quiz.title}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress Bar (Only during question stepper) */}
        {!isCompleted && (
          <div className="w-full bg-slate-100 h-1.5 shrink-0 overflow-hidden">
            <div
              className="bg-sky-500 h-full transition-all duration-300 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}

        {/* Main Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {!isCompleted && currentQuestion ? (
            <div className="space-y-6">
              {/* Question Count & Stepper Tag */}
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span className="font-mono text-slate-500 font-bold">
                  Question {currentIndex + 1} of {total}
                </span>
                {currentQuestion.locationHint && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                    <Compass className="h-3 w-3" />
                    <span>{currentQuestion.locationHint}</span>
                  </span>
                )}
              </div>

              {/* Question Text */}
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug font-heading">
                {currentQuestion.question}
              </h3>

              {/* 4 Multiple-Choice Options */}
              <div className="space-y-2.5">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedAnswers[currentQuestion.id] === idx;
                  const isRevealed = revealedQuestions[currentQuestion.id];
                  const isCorrect = idx === currentQuestion.correctOptionIndex;

                  let optionStyle =
                    'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700';

                  if (isSelected && !isRevealed) {
                    optionStyle = 'border-sky-500 bg-sky-50/70 text-sky-900 ring-2 ring-sky-200';
                  }

                  if (isRevealed) {
                    if (isCorrect) {
                      optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200 font-semibold';
                    } else if (isSelected && !isCorrect) {
                      optionStyle = 'border-rose-400 bg-rose-50 text-rose-900 ring-2 ring-rose-200 opacity-90';
                    } else {
                      optionStyle = 'border-slate-200 bg-slate-50/50 text-slate-400 opacity-60';
                    }
                  }

                  const letter = String.fromCharCode(65 + idx); // A, B, C, D

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isRevealed}
                      onClick={() => handleSelectOption(idx)}
                      className={cn(
                        'w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer text-xs sm:text-sm',
                        optionStyle
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-lg border font-mono text-xs font-bold shrink-0 mt-0.5',
                          isSelected && !isRevealed && 'border-sky-500 bg-sky-500 text-white',
                          isRevealed && isCorrect && 'border-emerald-600 bg-emerald-600 text-white',
                          isRevealed && isSelected && !isCorrect && 'border-rose-500 bg-rose-500 text-white',
                          !isSelected && !isRevealed && 'border-slate-200 bg-slate-100 text-slate-600'
                        )}
                      >
                        {letter}
                      </span>
                      <span className="flex-1 leading-relaxed">{option}</span>
                      {isRevealed && isCorrect && (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                      )}
                      {isRevealed && isSelected && !isCorrect && (
                        <XCircle className="h-5 w-5 text-rose-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Reveal Box */}
              {revealedQuestions[currentQuestion.id] && (
                <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4 space-y-2 animate-in fade-in-0 duration-200">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800">
                    <HelpCircle className="h-4 w-4 text-sky-600" />
                    <span>Educational Explanation</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {currentQuestion.explanation}
                  </p>
                  {currentQuestion.locationHint && (
                    <div className="pt-1.5 text-[11px] font-mono text-slate-500">
                      Citation Reference: <span className="text-slate-800 font-semibold">{currentQuestion.locationHint}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : isCompleted && submissionResult ? (
            /* Results Screen */
            <div className="space-y-6 text-center py-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 shadow-sm animate-bounce">
                {submissionResult.percentage >= 70 ? (
                  <Trophy className="h-8 w-8 text-amber-500" />
                ) : (
                  <Award className="h-8 w-8 text-sky-600" />
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-heading">
                  {submissionResult.percentage >= 80
                    ? 'Mastery Achieved! 🏆'
                    : submissionResult.percentage >= 60
                    ? 'Good Progress! 📚'
                    : 'Needs Review 💡'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  You scored{' '}
                  <span className="font-extrabold text-slate-900">
                    {submissionResult.score} of {submissionResult.total}
                  </span>{' '}
                  ({submissionResult.percentage}%)
                </p>
              </div>

              {/* Question Breakdown List */}
              <div className="space-y-3 text-left pt-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Detailed Answer Review
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {submissionResult.breakdown.map((item, idx) => (
                    <div
                      key={item.questionId}
                      className={cn(
                        'p-3 rounded-xl border text-xs space-y-1',
                        item.isCorrect
                          ? 'border-emerald-200 bg-emerald-50/40 text-emerald-950'
                          : 'border-rose-200 bg-rose-50/40 text-rose-950'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold">
                          {idx + 1}. {item.question}
                        </span>
                        {item.isCorrect ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {item.explanation}
                      </p>
                      {item.locationHint && (
                        <span className="text-[10px] font-mono text-slate-400 block">
                          Source: {item.locationHint}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-xs">Loading quiz questions...</p>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          {!isCompleted ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="text-xs gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Previous</span>
              </Button>

              <div className="flex items-center gap-2">
                {currentQuestion && !revealedQuestions[currentQuestion.id] ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleRevealAnswer}
                    disabled={selectedAnswers[currentQuestion.id] === undefined}
                    className="text-xs border-sky-300 text-sky-700 hover:bg-sky-50 font-bold cursor-pointer"
                  >
                    Check Answer
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleNext}
                    disabled={submitMutation.isPending}
                    className="text-xs bg-sky-600 hover:bg-sky-700 text-white font-bold gap-1 cursor-pointer"
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Grading...</span>
                      </>
                    ) : currentIndex === total - 1 ? (
                      <>
                        <span>Finish Quiz</span>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </>
                    ) : (
                      <>
                        <span>Next Question</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRetake}
                className="text-xs gap-1.5 font-bold"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Retake Quiz</span>
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={onClose}
                className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold"
              >
                Done
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
