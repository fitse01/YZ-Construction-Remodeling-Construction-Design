import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { uploadGeneric } from '../middleware/upload';
import * as mediaController from '../controllers/media.controller';

const router = Router();

const handleUploadMiddleware = (multerMiddleware: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    multerMiddleware(req, res, (err: any) => {
      if (err) {
        console.error('Multer upload error:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            error: 'File is too large. Maximum allowed file size is 2GB.',
            code: 'LIMIT_FILE_SIZE',
          });
        }
        return res.status(400).json({ error: err.message || 'File upload failed' });
      }
      next();
    });
  };
};

// Public media listing if needed, protected upload/delete
router.get('/', mediaController.getMediaList);

router.post(
  '/upload',
  authenticate,
  authorize(['OWNER', 'ADMIN', 'STAFF']),
  handleUploadMiddleware(uploadGeneric.single('file')),
  mediaController.uploadMediaFile
);

router.post(
  '/upload/:folder',
  authenticate,
  authorize(['OWNER', 'ADMIN', 'STAFF']),
  handleUploadMiddleware(uploadGeneric.single('file')),
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
