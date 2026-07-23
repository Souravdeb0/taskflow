import { Response } from 'express';
import { Table, StringRecordId } from 'surrealdb';
import { db, safeQuery, safeSelect, safeMerge } from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { logActivity } from '../services/activityService.js';
import { checkInactiveTickets } from '../services/cronService.js';

export async function getTicketsHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { status, assigneeId } = req.query;

    let queryStr = 'SELECT * FROM ticket';
    const bindings: any = {};

    if (status) {
      queryStr += ' WHERE status = $status';
      bindings.status = status;
    }

    queryStr += ' ORDER BY created_at DESC FETCH created_by';

    const rawTickets: any = await safeQuery(queryStr, bindings);
    let tickets = Array.isArray(rawTickets[0]) ? rawTickets[0] : (rawTickets ? [rawTickets] : []);

    for (const ticket of tickets) {
      const rawAssignees: any = await safeQuery(
        'SELECT * FROM ticket_assignee WHERE ticket_id = $ticketId FETCH user_id, assigned_by',
        { ticketId: new StringRecordId(ticket.id) }
      );
      ticket.assignees = Array.isArray(rawAssignees[0]) ? rawAssignees[0] : [];
    }

    if (assigneeId) {
      const targetAssigneeId = (assigneeId as string).startsWith('user:') 
        ? (assigneeId as string) 
        : `user:${assigneeId}`;
        
      tickets = tickets.filter((t: any) => 
        t.assignees.some((a: any) => a.user_id && a.user_id.id === targetAssigneeId)
      );
    }

    res.json({ tickets });
  } catch (error) {
    console.error('Failed to get tickets:', error);
    res.status(500).json({ error: 'Failed to retrieve tickets' });
  }
}

export async function getTicketByIdHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const ticketRecordId = id.startsWith('ticket:') ? id : `ticket:${id}`;

    const rawTicket: any = await safeSelect(new StringRecordId(ticketRecordId));
    const ticket = Array.isArray(rawTicket) ? rawTicket[0] : rawTicket;

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.created_by) {
      const creatorId = typeof ticket.created_by === 'string' ? ticket.created_by : ticket.created_by.id;
      const rawCreator = await safeSelect(new StringRecordId(creatorId));
      ticket.created_by = Array.isArray(rawCreator) ? rawCreator[0] : rawCreator;
    }

    // Fetch assignees
    const rawAssignees: any = await safeQuery(
      'SELECT * FROM ticket_assignee WHERE ticket_id = $ticketId FETCH user_id, assigned_by',
      { ticketId: new StringRecordId(ticketRecordId) }
    );
    ticket.assignees = Array.isArray(rawAssignees[0]) ? rawAssignees[0] : [];

    // Fetch comments
    const rawComments: any = await safeQuery(
      'SELECT * FROM comment WHERE ticket_id = $ticketId ORDER BY created_at ASC FETCH user_id',
      { ticketId: new StringRecordId(ticketRecordId) }
    );
    ticket.comments = Array.isArray(rawComments[0]) ? rawComments[0] : [];

    res.json({ ticket });
  } catch (error) {
    console.error('Failed to get ticket details:', error);
    res.status(500).json({ error: 'Failed to retrieve ticket' });
  }
}

export async function createTicketHandler(req: AuthenticatedRequest, res: Response) {
  try {
    if (req.user?.role !== 'Admin' && req.user?.role !== 'Manager') {
      return res.status(403).json({ error: 'Forbidden: Only Managers or Admins can create tickets' });
    }

    const { title, description, status, priority } = req.body;
    const creatorId = req.user!.id;
    const now = new Date().toISOString();

    const rawResult = await (db as any).create(new Table('ticket'), {
      title,
      description,
      status: status || 'Todo',
      priority: priority || 'Low',
      created_by: new StringRecordId(creatorId),
      created_at: now,
      updated_at: now,
    });
    
    const ticket = Array.isArray(rawResult) ? rawResult[0] : rawResult;

    await logActivity(ticket.id, creatorId, 'TICKET_CREATED', null, title);

    res.status(201).json({ message: 'Ticket created successfully', ticket });
  } catch (error) {
    console.error('Failed to create ticket:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
}

export async function updateTicketHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { title, description, status, priority } = req.body;
    const ticketRecordId = id.startsWith('ticket:') ? id : `ticket:${id}`;
    const updaterId = req.user!.id;

    const rawExisting: any = await safeSelect(new StringRecordId(ticketRecordId));
    const existingTicket = Array.isArray(rawExisting) ? rawExisting[0] : rawExisting;

    if (!existingTicket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (req.user?.role === 'Employee') {
      // Employees can only update status, not title/description/priority
      if (title !== undefined && title !== existingTicket.title) {
        return res.status(403).json({ error: 'Forbidden: Employees cannot update ticket title' });
      }
      if (description !== undefined && description !== existingTicket.description) {
        return res.status(403).json({ error: 'Forbidden: Employees cannot update ticket description' });
      }
      if (priority !== undefined && priority !== existingTicket.priority) {
        return res.status(403).json({ error: 'Forbidden: Employees cannot update ticket priority' });
      }
      
      // If changing status, must be assigned to the ticket
      if (status !== undefined && status !== existingTicket.status) {
        const rawAssignees: any = await safeQuery(
          'SELECT * FROM ticket_assignee WHERE ticket_id = $ticketId AND user_id = $userId',
          { ticketId: new StringRecordId(ticketRecordId), userId: new StringRecordId(updaterId) }
        );
        const assignees = Array.isArray(rawAssignees[0]) ? rawAssignees[0] : [];
        if (assignees.length === 0) {
          return res.status(403).json({ error: 'Forbidden: Employees can only update status of tickets assigned to them' });
        }
      }
    } else if (req.user?.role !== 'Admin' && req.user?.role !== 'Manager') {
      return res.status(403).json({ error: 'Forbidden: Unauthorized' });
    }

    const now = new Date().toISOString();
    
    const rawUpdated = await safeMerge(new StringRecordId(ticketRecordId), {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(priority !== undefined && { priority }),
      updated_at: now,
    });
    const updatedTicket = Array.isArray(rawUpdated) ? rawUpdated[0] : rawUpdated;

    if (status !== undefined && status !== existingTicket.status) {
      await logActivity(ticketRecordId, updaterId, 'STATUS_UPDATED', existingTicket.status, status);
    }
    if (priority !== undefined && priority !== existingTicket.priority) {
      await logActivity(ticketRecordId, updaterId, 'PRIORITY_UPDATED', existingTicket.priority, priority);
    }
    if ((title !== undefined && title !== existingTicket.title) || 
        (description !== undefined && description !== existingTicket.description)) {
      await logActivity(ticketRecordId, updaterId, 'TICKET_UPDATED', null, null);
    }

    res.json({ message: 'Ticket updated successfully', ticket: updatedTicket });
  } catch (error) {
    console.error('Failed to update ticket:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
}

export async function deleteTicketHandler(req: AuthenticatedRequest, res: Response) {
  try {
    if (req.user?.role !== 'Admin' && req.user?.role !== 'Manager') {
      return res.status(403).json({ error: 'Forbidden: Only Managers or Admins can delete tickets' });
    }

    const { id } = req.params;
    const ticketRecordId = id.startsWith('ticket:') ? id : `ticket:${id}`;

    const rawExisting = await safeSelect(new StringRecordId(ticketRecordId));
    const existing = Array.isArray(rawExisting) ? rawExisting[0] : rawExisting;

    if (!existing) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    await db.delete(new StringRecordId(ticketRecordId));
    await safeQuery('DELETE comment WHERE ticket_id = $ticketId', { ticketId: new StringRecordId(ticketRecordId) });
    await safeQuery('DELETE ticket_assignee WHERE ticket_id = $ticketId', { ticketId: new StringRecordId(ticketRecordId) });
    await safeQuery('DELETE activity_log WHERE ticket_id = $ticketId', { ticketId: new StringRecordId(ticketRecordId) });

    res.json({ message: 'Ticket and all related logs deleted successfully' });
  } catch (error) {
    console.error('Failed to delete ticket:', error);
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
}

export async function assignUserHandler(req: AuthenticatedRequest, res: Response) {
  try {
    if (req.user?.role !== 'Admin' && req.user?.role !== 'Manager') {
      return res.status(403).json({ error: 'Forbidden: Only Managers or Admins can assign users' });
    }

    const { id } = req.params;
    const { userId } = req.body;
    const ticketRecordId = id.startsWith('ticket:') ? id : `ticket:${id}`;
    const userRecordId = userId.startsWith('user:') ? userId : `user:${userId}`;
    const assignerId = req.user!.id;

    const rawTicket = await safeSelect(new StringRecordId(ticketRecordId));
    if (!rawTicket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const rawAssigneeUser = await safeSelect(new StringRecordId(userRecordId));
    const assigneeUser = Array.isArray(rawAssigneeUser) ? rawAssigneeUser[0] : rawAssigneeUser;
    if (!assigneeUser) {
      return res.status(404).json({ error: 'User to assign not found' });
    }

    const rawExisting: any = await safeQuery(
      'SELECT * FROM ticket_assignee WHERE ticket_id = $ticketId AND user_id = $userId',
      { ticketId: new StringRecordId(ticketRecordId), userId: new StringRecordId(userRecordId) }
    );
    const existingAssignee = Array.isArray(rawExisting[0]) ? rawExisting[0][0] : null;

    if (existingAssignee) {
      return res.status(400).json({ error: 'User is already assigned to this ticket' });
    }

    const now = new Date().toISOString();
    const rawAssignment = await (db as any).create(new Table('ticket_assignee'), {
      ticket_id: new StringRecordId(ticketRecordId),
      user_id: new StringRecordId(userRecordId),
      assigned_by: new StringRecordId(assignerId),
      assigned_at: now,
    });
    const assignment = Array.isArray(rawAssignment) ? rawAssignment[0] : rawAssignment;

    await logActivity(ticketRecordId, assignerId, 'ASSIGNEE_ADDED', null, assigneeUser.name || assigneeUser.email);
    await safeMerge(new StringRecordId(ticketRecordId), { updated_at: now });

    res.status(201).json({ message: 'User assigned successfully', assignment });
  } catch (error) {
    console.error('Failed to assign user:', error);
    res.status(500).json({ error: 'Failed to assign user' });
  }
}

export async function unassignUserHandler(req: AuthenticatedRequest, res: Response) {
  try {
    if (req.user?.role !== 'Admin' && req.user?.role !== 'Manager') {
      return res.status(403).json({ error: 'Forbidden: Only Managers or Admins can unassign users' });
    }

    const { id, userId } = req.params;
    const ticketRecordId = id.startsWith('ticket:') ? id : `ticket:${id}`;
    const userRecordId = userId.startsWith('user:') ? userId : `user:${userId}`;
    const unassignerId = req.user!.id;

    const rawTicket = await safeSelect(new StringRecordId(ticketRecordId));
    if (!rawTicket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const rawUser = await safeSelect(new StringRecordId(userRecordId));
    const userToUnassign = Array.isArray(rawUser) ? rawUser[0] : rawUser;
    const userName = userToUnassign ? (userToUnassign.name || userToUnassign.email) : userRecordId;

    const deleteQuery: any = await safeQuery(
      'DELETE ticket_assignee WHERE ticket_id = $ticketId AND user_id = $userId RETURN BEFORE',
      { ticketId: new StringRecordId(ticketRecordId), userId: new StringRecordId(userRecordId) }
    );
    const deletedList = deleteQuery[0];
    const deletedCount = Array.isArray(deletedList) ? deletedList.length : (deletedList ? 1 : 0);

    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    await logActivity(ticketRecordId, unassignerId, 'ASSIGNEE_REMOVED', userName, null);
    await safeMerge(new StringRecordId(ticketRecordId), { updated_at: new Date().toISOString() });

    res.json({ message: 'User unassigned successfully' });
  } catch (error) {
    console.error('Failed to unassign user:', error);
    res.status(500).json({ error: 'Failed to unassign user' });
  }
}

export async function getTicketActivityHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const ticketRecordId = id.startsWith('ticket:') ? id : `ticket:${id}`;

    const rawTicket = await safeSelect(new StringRecordId(ticketRecordId));
    if (!rawTicket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const rawLogs: any = await safeQuery(
      'SELECT * FROM activity_log WHERE ticket_id = $ticketId ORDER BY created_at DESC FETCH user_id',
      { ticketId: new StringRecordId(ticketRecordId) }
    );
    const logs = Array.isArray(rawLogs[0]) ? rawLogs[0] : [];

    res.json({ logs });
  } catch (error) {
    console.error('Failed to fetch activity logs:', error);
    res.status(500).json({ error: 'Failed to retrieve activity log' });
  }
}

export async function devTriggerRemindersHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const count = await checkInactiveTickets();
    res.json({ message: 'Reminders triggered successfully', processed_tickets_count: count });
  } catch (error) {
    console.error('Failed to trigger reminders manually:', error);
    res.status(500).json({ error: 'Failed to process reminders manually' });
  }
}
