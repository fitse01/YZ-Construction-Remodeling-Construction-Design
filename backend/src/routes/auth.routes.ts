import { Router } from 'express';
import { loginRateLimiter } from '../middleware/rateLimiter';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.post('/login', loginRateLimiter, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/change-password', authController.changePassword);

export default router;
