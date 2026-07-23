import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as serviceController from '../controllers/service.controller';

const router = Router();

// Public routes
router.get('/', serviceController.getServices);
router.get('/slug/:slug', serviceController.getServiceBySlug);
router.get('/:id', serviceController.getServiceById);

// Protected routes (admin only)
router.post('/', authenticate, authorize(['OWNER', 'ADMIN']), serviceController.createService);
router.put('/:id', authenticate, authorize(['OWNER', 'ADMIN']), serviceController.updateService);
router.delete('/:id', authenticate, authorize(['OWNER', 'ADMIN']), serviceController.deleteService);
router.patch('/:id/publish', authenticate, authorize(['OWNER', 'ADMIN']), serviceController.togglePublish);
router.patch('/:id/archive', authenticate, authorize(['OWNER', 'ADMIN']), serviceController.archiveService);
router.post('/:id/duplicate', authenticate, authorize(['OWNER', 'ADMIN']), serviceController.duplicateService);

export default router;
