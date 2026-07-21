import { Router } from 'express';
import { contactFormRateLimiter } from '../middleware/rateLimiter';
import { authenticate, authorize } from '../middleware/auth';
import * as messageController from '../controllers/message.controller';

const router = Router();

// Public route (for frontend contact form)
router.post('/', contactFormRateLimiter, messageController.createMessage);

// Protected routes (admin only)
router.get('/', authenticate, authorize(['OWNER', 'ADMIN']), messageController.getMessages);
router.get('/:id', authenticate, authorize(['OWNER', 'ADMIN']), messageController.getMessageById);
router.patch('/:id/read', authenticate, authorize(['OWNER', 'ADMIN']), messageController.markAsRead);
router.delete('/:id', authenticate, authorize(['OWNER', 'ADMIN']), messageController.deleteMessage);

export default router;
