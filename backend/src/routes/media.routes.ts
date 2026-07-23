import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { uploadGeneric } from '../middleware/upload';
import * as mediaController from '../controllers/media.controller';

const router = Router();

// Public media listing if needed, protected upload/delete
router.get('/', mediaController.getMediaList);

router.post(
  '/upload',
  authenticate,
  authorize(['OWNER', 'ADMIN', 'STAFF']),
  uploadGeneric.single('file'),
  mediaController.uploadMediaFile
);

router.post(
  '/upload/:folder',
  authenticate,
  authorize(['OWNER', 'ADMIN', 'STAFF']),
  uploadGeneric.single('file'),
  mediaController.uploadMediaFile
);

router.patch(
  '/:id/rename',
  authenticate,
  authorize(['OWNER', 'ADMIN', 'STAFF']),
  mediaController.renameMedia
);

router.delete(
  '/:id',
  authenticate,
  authorize(['OWNER', 'ADMIN']),
  mediaController.deleteMedia
);

export default router;
