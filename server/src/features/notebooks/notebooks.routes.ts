import { Router } from 'express';
import { NotebooksController } from './notebooks.controller.js';
import { requireUserAuth } from '../../middleware/auth.js';

const router = Router();

router.use(requireUserAuth);

router.post('/', NotebooksController.create);
router.get('/', NotebooksController.list);
router.get('/:id', NotebooksController.getById);
router.patch('/:id', NotebooksController.update);
router.delete('/:id', NotebooksController.delete);

export const notebookRoutes = router;
