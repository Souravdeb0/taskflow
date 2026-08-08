import { Router } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { generateTicketSummary, chatWithCopilot } from '../services/aiService.js';
import { safeSelect, safeQuery } from '../config/db.js';
import { StringRecordId } from 'surrealdb';

const router = Router();

// Endpoint to generate a ticket summary
router.post('/summarize', authMiddleware as any, async (req: AuthenticatedRequest, res) => {
  const { ticketId } = req.body;
  if (!ticketId) {
    return res.status(400).json({ error: 'ticketId is required' });
  }
  try {
    const recordId = new StringRecordId(ticketId);
    let ticket = await safeSelect(recordId);
    ticket = Array.isArray(ticket) ? ticket[0] : ticket;

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const summary = await generateTicketSummary(ticket);
    res.json({ summary });
  } catch (err: any) {
    console.error('Error in summarize handler:', err);
    res.status(500).json({ error: err.message || 'Failed to generate summary' });
  }
});

// Endpoint for AI Copilot chat assistant
router.post('/chat', authMiddleware as any, async (req: AuthenticatedRequest, res) => {
  const { message, chatHistory = [] } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }
  try {
    // 1. Fetch tickets from database
    const ticketsResult = await safeQuery('SELECT * FROM ticket ORDER BY created_at DESC LIMIT 30;');
    const tickets = ticketsResult[0] || [];

    // 2. Fetch users from database
    const usersResult = await safeQuery('SELECT * FROM user;');
    const users = usersResult[0] || [];

    // 3. Get current authenticated user context
    const currentUser = {
      name: req.user?.name || 'User',
      role: req.user?.role || 'Employee'
    };

    const reply = await chatWithCopilot(message, chatHistory, tickets, users, currentUser);
    res.json({ reply });
  } catch (err: any) {
    console.error('Error in copilot chat handler:', err);
    res.status(500).json({ error: err.message || 'Failed to get chat response' });
  }
});

export default router;
