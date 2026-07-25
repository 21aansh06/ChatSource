import { Router } from 'express';
import { ChatController } from './chat.controller.js';
import { requireUserAuth } from '../../middleware/auth.js';

const router = Router({ mergeParams: true });
router.use(requireUserAuth);

router.post('/', ChatController.ask);
router.get('/sessions', ChatController.listSessions);
router.get('/sessions/:sessionId', ChatController.getSessionHistory);

export const chatRoutes = router;
