import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getUsersHandler, updateUserRoleHandler } from '../controllers/userController.js';

const router = Router();

router.get('/', authMiddleware as any, getUsersHandler as any);
router.put('/:id/role', authMiddleware as any, updateUserRoleHandler as any);

export default router;
