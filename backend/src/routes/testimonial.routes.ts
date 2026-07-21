import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as testimonialController from '../controllers/testimonial.controller';

const router = Router();

// Public routes
router.get('/', testimonialController.getTestimonials);
router.get('/:id', testimonialController.getTestimonialById);

// Protected routes (admin only)
router.post('/', authenticate, authorize(['OWNER', 'ADMIN']), testimonialController.createTestimonial);
router.put('/:id', authenticate, authorize(['OWNER', 'ADMIN']), testimonialController.updateTestimonial);
router.delete('/:id', authenticate, authorize(['OWNER', 'ADMIN']), testimonialController.deleteTestimonial);
router.patch('/:id/publish', authenticate, authorize(['OWNER', 'ADMIN']), testimonialController.togglePublish);

export default router;
