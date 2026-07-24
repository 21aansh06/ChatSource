import { Router } from 'express';
import { SourcesController } from './sources.controller.js';
import { requireUserAuth } from '../../middleware/auth.js';
import { uploadSingleFile } from '../../middleware/upload.js';

const router = Router({ mergeParams: true });

router.use(requireUserAuth);

router.post('/', uploadSingleFile, SourcesController.create);
router.get('/', SourcesController.list);

export const sourceRoutes = router;

const directSourceRouter = Router();
directSourceRouter.use(requireUserAuth);
directSourceRouter.delete('/:sourceId', SourcesController.delete);

export const directSourceRoutes = directSourceRouter;
