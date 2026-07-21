import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as mediaController from '../controllers/media.controller';

const router = Router();

// All media routes are protected
router.post(
  '/:projectId/images',
  authenticate,
  authorize(['OWNER', 'ADMIN']),
  mediaController.uploadImage
);
router.post(
  '/:projectId/videos',
  authenticate,
  authorize(['OWNER', 'ADMIN']),
  mediaController.uploadVideo
);
router.patch(
  '/:id/reorder',
  authenticate,
  authorize(['OWNER', 'ADMIN']),
  mediaController.reorderMedia
);
router.delete(
  '/:id',
  authenticate,
  authorize(['OWNER', 'ADMIN']),
  mediaController.deleteMedia
);

export default router;
