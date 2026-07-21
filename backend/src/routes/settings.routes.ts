import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as settingsController from '../controllers/settings.controller';

const router = Router();

// Public routes
router.get('/site', settingsController.getSiteSettings);
router.get('/homepage', settingsController.getHomePage);

// Protected routes (admin only)
router.put('/site', authenticate, authorize(['OWNER', 'ADMIN']), settingsController.updateSiteSettings);
router.put('/homepage', authenticate, authorize(['OWNER', 'ADMIN']), settingsController.updateHomePage);

export default router;
