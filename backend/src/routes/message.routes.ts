import { Router } from 'express';
import { contactFormRateLimiter } from '../middleware/rateLimiter';
import { authenticate, authorize } from '../middleware/auth';
import * as messageController from '../controllers/message.controller';

const router = Router();

// Public route (for frontend contact form & estimates)
router.post('/', contactFormRateLimiter, messageController.createMessage);

// Protected routes (admin only)
router.get('/', authenticate, authorize(['OWNER', 'ADMIN', 'STAFF']), messageController.getMessages);
router.get('/:id', authenticate, authorize(['OWNER', 'ADMIN', 'STAFF']), messageController.getMessageById);
router.patch('/:id/read', authenticate, authorize(['OWNER', 'ADMIN', 'STAFF']), messageController.updateMessageStatus);
router.patch('/:id', authenticate, authorize(['OWNER', 'ADMIN', 'STAFF']), messageController.updateMessageStatus);
router.delete('/:id', authenticate, authorize(['OWNER', 'ADMIN']), messageController.deleteMessage);

export default router;
