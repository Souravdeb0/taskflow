import { Router } from 'express';
import { getUsers } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware as any, getUsers as any);

export default router;
