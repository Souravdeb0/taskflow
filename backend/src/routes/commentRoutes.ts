import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validate, commentSchema } from '../middleware/validate.js';
import {
  getCommentsHandler,
  addCommentHandler,
  updateCommentHandler,
  deleteCommentHandler,
} from '../controllers/commentController.js';

const router = Router();

router.get('/tickets/:id/comments', authMiddleware as any, getCommentsHandler as any);
router.post('/tickets/:id/comments', authMiddleware as any, validate(commentSchema) as any, addCommentHandler as any);
router.put('/comments/:id', authMiddleware as any, validate(commentSchema) as any, updateCommentHandler as any);
router.delete('/comments/:id', authMiddleware as any, deleteCommentHandler as any);

export default router;
