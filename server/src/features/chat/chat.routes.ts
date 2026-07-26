import { Router } from 'express';
import { ChatController } from './chat.controller.js';
import { requireUserAuth } from '../../middleware/auth.js';

const router = Router({ mergeParams: true });

router.use(requireUserAuth);

// Nested endpoints: /api/notebooks/:notebookId/chat
router.post('/', ChatController.ask);
router.get('/stream/:sessionId', ChatController.stream);
router.get('/sessions', ChatController.listSessions);
router.get('/sessions/:sessionId', ChatController.getSessionHistory);

export const chatRoutes = router;
