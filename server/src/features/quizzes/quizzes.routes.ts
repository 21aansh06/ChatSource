import { Router } from 'express';
import { requireUserAuth } from '../../middleware/auth.js';
import { QuizzesController } from './quizzes.controller.js';

const router = Router();
router.use(requireUserAuth);

// Routes for /api/notebooks/:notebookId/sources/:sourceId/quizzes
router.post('/:notebookId/sources/:sourceId/quizzes', QuizzesController.generate);
router.get('/:notebookId/sources/:sourceId/quizzes', QuizzesController.listBySource);

// Routes for /api/notebooks/:notebookId/quizzes
router.get('/:notebookId/quizzes/:quizId', QuizzesController.getById);
router.delete('/:notebookId/quizzes/:quizId', QuizzesController.delete);
router.post('/:notebookId/quizzes/:quizId/attempts', QuizzesController.submitAttempt);
router.get('/:notebookId/quizzes/:quizId/attempts', QuizzesController.getAttempts);

export const quizzesRoutes = router;
