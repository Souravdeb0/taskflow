import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validate, createTicketSchema, updateTicketSchema, assignUserSchema } from '../middleware/validate.js';
import {
  getTicketsHandler,
  getTicketByIdHandler,
  createTicketHandler,
  updateTicketHandler,
  deleteTicketHandler,
  assignUserHandler,
  unassignUserHandler,
  getTicketActivityHandler,
  devTriggerRemindersHandler,
} from '../controllers/ticketController.js';

const router = Router();

router.get('/', authMiddleware as any, getTicketsHandler as any);
router.get('/:id', authMiddleware as any, getTicketByIdHandler as any);
router.post('/', authMiddleware as any, validate(createTicketSchema) as any, createTicketHandler as any);
router.put('/:id', authMiddleware as any, validate(updateTicketSchema) as any, updateTicketHandler as any);
router.delete('/:id', authMiddleware as any, deleteTicketHandler as any);

router.post('/:id/assign', authMiddleware as any, validate(assignUserSchema) as any, assignUserHandler as any);
router.delete('/:id/assign/:userId', authMiddleware as any, unassignUserHandler as any);

router.get('/:id/activity', authMiddleware as any, getTicketActivityHandler as any);
router.post('/dev/trigger-reminders', authMiddleware as any, devTriggerRemindersHandler as any);

export default router;
