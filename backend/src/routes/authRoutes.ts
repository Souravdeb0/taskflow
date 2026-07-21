import { Router } from 'express';
import { login, getProfile } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/login', authMiddleware as any, login as any);
router.get('/profile', authMiddleware as any, getProfile as any);

export default router;
