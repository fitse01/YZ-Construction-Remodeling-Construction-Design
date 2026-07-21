import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as uploadController from '../controllers/upload.controller';

const router = Router();

// All upload routes are protected
router.post(
  '/project/:projectId/images',
  authenticate,
  authorize(['OWNER', 'ADMIN']),
  uploadController.uploadProjectImages
);
router.post(
  '/project/:projectId/videos',
  authenticate,
  authorize(['OWNER', 'ADMIN']),
  uploadController.uploadProjectVideos
);

export default router;
