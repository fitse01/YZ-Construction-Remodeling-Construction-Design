import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as projectController from '../controllers/project.controller';

const router = Router();

// Public routes (for frontend)
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProjectById);

// Protected routes (admin only)
router.post('/', authenticate, authorize(['OWNER', 'ADMIN', 'STAFF']), projectController.createProject);
router.put('/:id', authenticate, authorize(['OWNER', 'ADMIN', 'STAFF']), projectController.updateProject);
router.post('/:id/duplicate', authenticate, authorize(['OWNER', 'ADMIN', 'STAFF']), projectController.duplicateProject);
router.patch('/:id/publish', authenticate, authorize(['OWNER', 'ADMIN', 'STAFF']), projectController.togglePublish);
router.delete('/:id', authenticate, authorize(['OWNER', 'ADMIN']), projectController.deleteProject);

export default router;
