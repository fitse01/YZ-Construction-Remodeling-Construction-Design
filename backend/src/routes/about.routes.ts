import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as aboutController from '../controllers/about.controller';

const router = Router();

router.get('/content', aboutController.getAboutContent);
router.get('/team', aboutController.getTeamMembers);

router.get('/team/all', authenticate, authorize(['OWNER', 'ADMIN']), aboutController.getAllTeamMembers);
router.put('/content', authenticate, authorize(['OWNER', 'ADMIN']), aboutController.updateAboutContent);
router.post('/team', authenticate, authorize(['OWNER', 'ADMIN']), aboutController.createTeamMember);
router.put('/team/:id', authenticate, authorize(['OWNER', 'ADMIN']), aboutController.updateTeamMember);
router.delete('/team/:id', authenticate, authorize(['OWNER', 'ADMIN']), aboutController.deleteTeamMember);

export default router;