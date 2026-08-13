import { Router } from 'express';
import { requireUserAuth } from '../../middleware/auth.js';
import { UsersController } from './users.controller.js';

const router = Router();

router.use(requireUserAuth);
router.get('/me', UsersController.getCurrentUser);

export const userRoutes =  router;
