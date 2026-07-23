import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { loginHandler, profileHandler } from '../controllers/authController.js';

const router = Router();

router.post('/login', authMiddleware as any, loginHandler as any);
router.get('/profile', authMiddleware as any, profileHandler as any);

export default router;
