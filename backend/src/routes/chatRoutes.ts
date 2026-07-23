import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  createChatHandler,
  getChatsHandler,
  updateChatMembersHandler,
  getChatMessagesHandler,
  sendMessageHandler,
} from '../controllers/chatController.js';

const router = Router();

router.post('/', authMiddleware as any, createChatHandler as any);
router.get('/', authMiddleware as any, getChatsHandler as any);
router.put('/:id/members', authMiddleware as any, updateChatMembersHandler as any);
router.get('/:id/messages', authMiddleware as any, getChatMessagesHandler as any);
router.post('/:id/messages', authMiddleware as any, sendMessageHandler as any);

export default router;
