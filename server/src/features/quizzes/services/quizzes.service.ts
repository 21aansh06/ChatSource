import { prisma } from '../../../infra/prisma.js';
import { QuizStatus } from '@prisma/client';
import { quizGenerationQueue } from '../queue/quiz.queue.js';
import { CreateQuizInput, QuizQuestion } from '../schemas/quiz.schema.js';

export class QuizzesService {
  /**
   * Enqueues an asynchronous quiz generation job and creates a PENDING quiz record.
   */
  static async generateQuizAsync(
    userId: string,
    notebookId: string,
    sourceId: string,
    input: CreateQuizInput
  ) {
    // 1. Verify notebook and source ownership
    const source = await prisma.source.findFirst({
      where: {
        id: sourceId,
        notebookId,
        userId,
      },
    });
    console.log(sourceId)
    console.log(notebookId)
    console.log(userId)
    console.log(source)

    if (!source) {
      throw new Error('Source not found or access denied.');
    }

    if (source.status !== 'COMPLETED') {
      throw new Error(`Source is not ready for quiz generation (current status: ${source.status}).`);
    }

    // 2. Persist initial Quiz record in PENDING state
    const quiz = await prisma.quiz.create({
      data: {
        sourceId,
        notebookId,
        userId,
        title: `Quiz: ${source.title}`,
        difficulty: input.difficulty,
        totalQuestions: input.questionCount,
        status: QuizStatus.PENDING,
      },
    });

    // 3. Enqueue background generation task
    await quizGenerationQueue.add(
      'generate-quiz',
      {
        quizId: quiz.id,
        sourceId,
        notebookId,
        userId,
        questionCount: input.questionCount,
        difficulty: input.difficulty,
        provider: input.provider,
      },
      {
        jobId: `quiz-${quiz.id}`,
      }
    );

    return quiz;
  }

  /**
   * Lists all quizzes for a specific source.
   */
  static async getQuizzesBySource(userId: string, notebookId: string, sourceId: string) {
    return prisma.quiz.findMany({
      where: {
        sourceId,
        notebookId,
        userId,
      },
      include: {
        attempts: {
          orderBy: { completedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Retrieves single quiz by ID.
   */
  static async getQuizById(userId: string, notebookId: string, quizId: string) {
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        notebookId,
        userId,
      },
      include: {
        attempts: {
          orderBy: { completedAt: 'desc' },
        },
        source: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new Error('Quiz not found or access denied.');
    }

    return quiz;
  }

  /**
   * Deletes a quiz and cascades its attempts.
   */
  static async deleteQuiz(userId: string, notebookId: string, quizId: string) {
    const existing = await prisma.quiz.findFirst({
      where: { id: quizId, notebookId, userId },
    });

    if (!existing) {
      throw new Error('Quiz not found or access denied.');
    }

    return prisma.quiz.delete({
      where: { id: quizId },
    });
  }

  /**
   * Grades and persists a user's quiz attempt.
   */
  static async submitQuizAttempt(
    userId: string,
    notebookId: string,
    quizId: string,
    userAnswers: Record<string, number>,
    timeSpentSec?: number
  ) {
    const quiz = await prisma.quiz.findFirst({
      where: { id: quizId, notebookId, userId },
    });

    if (!quiz) {
      throw new Error('Quiz not found or access denied.');
    }

    if (quiz.status !== QuizStatus.COMPLETED || !quiz.questions) {
      throw new Error('This quiz is not completed and cannot be attempted yet.');
    }

    const questions = quiz.questions as unknown as QuizQuestion[];
    let score = 0;

    const breakdown = questions.map((q) => {
      const selectedIndex = userAnswers[q.id];
      const isCorrect = selectedIndex === q.correctOptionIndex;
      if (isCorrect) {
        score++;
      }

      return {
        questionId: q.id,
        question: q.question,
        selectedOptionIndex: selectedIndex ?? null,
        correctOptionIndex: q.correctOptionIndex,
        isCorrect,
        explanation: q.explanation,
        locationHint: q.locationHint,
      };
    });

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        userId,
        score,
        totalQuestions: questions.length,
        userAnswers,
        timeSpentSec: timeSpentSec ?? null,
      },
    });

    return {
      attempt,
      score,
      totalQuestions: questions.length,
      percentage: Math.round((score / questions.length) * 100),
      breakdown,
    };
  }

  /**
   * Fetches attempt history for a quiz.
   */
  static async getQuizAttempts(userId: string, notebookId: string, quizId: string) {
    const quiz = await prisma.quiz.findFirst({
      where: { id: quizId, notebookId, userId },
    });

    if (!quiz) {
      throw new Error('Quiz not found or access denied.');
    }

    return prisma.quizAttempt.findMany({
      where: { quizId, userId },
      orderBy: { completedAt: 'desc' },
    });
  }
}
