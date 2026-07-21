import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { Surreal, Table, RecordId, StringRecordId } from 'surrealdb';
import admin from 'firebase-admin';
import cron from 'node-cron';
import nodemailer from 'nodemailer';
import { z, ZodError, AnyZodObject } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// ==========================================
// 1. CONFIGURATION & DATABASE SETUP
// ==========================================
const PORT = process.env.PORT || 5000;
const url = process.env.SURREAL_URL || 'ws://127.0.0.1:8000';
const ns = process.env.SURREAL_NS || 'main';
const dbName = process.env.SURREAL_DB || 'main';
const user = process.env.SURREAL_USER || 'root';
const pass = process.env.SURREAL_PASS || 'root';

const db = new Surreal();

export async function connectDB() {
  try {
    await db.connect(url);
    await db.use({ namespace: ns, database: dbName });
    await db.signin({ username: user, password: pass });
    console.log(`Connected to SurrealDB at ${url} (NS: ${ns}, DB: ${dbName})`);
  } catch (error) {
    console.error('Failed to connect to SurrealDB:', error);
    process.exit(1);
  }
}

// ==========================================
// 2. FIREBASE ADMIN CONFIGURATION
// ==========================================
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

let firebaseInitialized = false;

if (projectId && clientEmail && privateKey) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
    console.log('Firebase Admin SDK initialized successfully');
    firebaseInitialized = true;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
  }
} else {
  console.warn(
    'Firebase credentials not found in environment. Running in DEVELOPMENT BYPASS MODE.'
  );
}

// ==========================================
// 3. AUTHENTICATION MIDDLEWARE
// ==========================================
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string; // user:uid
    firebaseUid: string;
    email: string;
    name: string;
    role: string;
  };
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    let firebaseUid: string | null = null;
    let email: string | null = null;
    let name: string | null = null;

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (firebaseInitialized && token) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        firebaseUid = decodedToken.uid;
        email = decodedToken.email || '';
        name = decodedToken.name || email.split('@')[0];
      } catch (error) {
        console.error('Firebase token verification failed:', error);
        return res.status(401).json({ error: 'Unauthorized: Invalid Firebase token' });
      }
    } else {
      // Development bypass check
      const mockUid = req.headers['x-mock-user-uid'] as string;
      const mockEmail = req.headers['x-mock-user-email'] as string;
      const mockName = req.headers['x-mock-user-name'] as string;

      if (mockUid) {
        firebaseUid = mockUid;
        email = mockEmail || `${mockUid}@example.com`;
        name = mockName || mockUid;
      } else {
        return res.status(401).json({
          error: 'Unauthorized: No token provided and no mock user headers found',
        });
      }
    }

    if (!firebaseUid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const recordId = `user:${firebaseUid}`;
    
    // Select the user record using StringRecordId wrapper
    const result = await db.select(new StringRecordId(recordId));
    let userRecord = Array.isArray(result) ? result[0] : result;

    if (!userRecord) {
      const defaultRole = 'Member';
      
      // Create user if they don't exist
      const createResult = await db.create(new StringRecordId(recordId), {
        name,
        email,
        firebaseUid,
        role: defaultRole,
        created_at: new Date().toISOString()
      });
      userRecord = Array.isArray(createResult) ? createResult[0] : createResult;
      console.log(`Synchronized new user in SurrealDB: ${recordId}`);
    }

    req.user = {
      id: recordId,
      firebaseUid,
      email: email || '',
      name: name || '',
      role: userRecord.role || 'Member'
    };

    next();
  } catch (error) {
    console.error('Error in auth middleware:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// ==========================================
// 4. INPUT VALIDATION MIDDLEWARE & SCHEMAS
// ==========================================
export function validate(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
}

const ticketStatusSchema = z.enum(['Todo', 'In Progress', 'Review', 'Done']);
const ticketPrioritySchema = z.enum(['Low', 'Medium', 'High', 'Critical']);

const createTicketSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().default(''),
    status: ticketStatusSchema.default('Todo'),
    priority: ticketPrioritySchema.default('Low'),
  }),
});

const updateTicketSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    status: ticketStatusSchema.optional(),
    priority: ticketPrioritySchema.optional(),
  }),
});

const assignUserSchema = z.object({
  body: z.object({
    userId: z.string().min(1, 'userId is required'),
  }),
});

const commentSchema = z.object({
  body: z.object({
    comment: z.string().min(1, 'Comment text is required'),
  }),
});

// ==========================================
// 5. ACTIVITY LOG & EMAIL SERVICES
// ==========================================
export async function logActivity(
  ticketId: string,
  userId: string,
  action: string,
  oldValue: string | null = null,
  newValue: string | null = null
) {
  try {
    const ticketRecord = ticketId.startsWith('ticket:') ? ticketId : `ticket:${ticketId}`;
    const userRecord = userId.startsWith('user:') ? userId : `user:${userId}`;

    await db.create(new Table('activity_log'), {
      ticket_id: new StringRecordId(ticketRecord),
      user_id: new StringRecordId(userRecord),
      action,
      old_value: oldValue,
      new_value: newValue,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to log activity in SurrealDB:', error);
  }
}

// Nodemailer config
const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

let transporter: nodemailer.Transporter | null = null;

if (smtpHost && smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
  console.log(`Nodemailer SMTP Transporter initialized (Host: ${smtpHost})`);
} else {
  console.warn('SMTP configuration missing. Email service will run in MOCK mode.');
}

export async function sendEmail({ to, subject, text }: { to: string; subject: string; text: string }) {
  try {
    if (transporter) {
      await transporter.sendMail({
        from: `"Jira Lite Reminders" <${smtpUser}>`,
        to,
        subject,
        text,
      });
      console.log(`Email successfully sent to ${to}`);
    } else {
      console.log(`
=========================================
[MOCK EMAIL SENT]
To: ${to}
Subject: ${subject}
Date: ${new Date().toISOString()}
Body:
${text}
=========================================
      `);
    }
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
  }
}

// ==========================================
// 6. INACTIVE TICKETS CRON JOB
// ==========================================
export async function checkInactiveTickets() {
  console.log('Running daily inactive tickets check...');
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffStr = sevenDaysAgo.toISOString();

    // Query tickets not Done that haven't been updated in 7 days
    const rawTickets: any = await db.query(
      'SELECT * FROM ticket WHERE status != "Done" AND updated_at < $cutoff',
      { cutoff: cutoffStr }
    );
    const inactiveTickets = Array.isArray(rawTickets[0]) ? rawTickets[0] : [];

    console.log(`Found ${inactiveTickets.length} inactive tickets.`);

    for (const ticket of inactiveTickets) {
      // Find assignees
      const rawAssignees: any = await db.query(
        'SELECT * FROM ticket_assignee WHERE ticket_id = $ticketId FETCH user_id',
        { ticketId: new StringRecordId(ticket.id) }
      );
      const assignees = Array.isArray(rawAssignees[0]) ? rawAssignees[0] : [];

      for (const assignee of assignees) {
        const userObj = assignee.user_id;
        if (userObj && userObj.email) {
          const emailBody = `Hi ${userObj.name || 'Team Member'},

The ticket "${ticket.title}" (Priority: ${ticket.priority}, Status: ${ticket.status}) has been inactive for more than 7 days.

Please review the ticket and provide an update on its progress.

Best regards,
Jira Lite Notifications`;

          await sendEmail({
            to: userObj.email,
            subject: `[Reminder] Inactive Ticket: ${ticket.title}`,
            text: emailBody,
          });
        }
      }
    }
    
    return inactiveTickets.length;
  } catch (error) {
    console.error('Error during inactive tickets check:', error);
    throw error;
  }
}

export function startReminderCron() {
  cron.schedule('0 0 * * *', async () => {
    try {
      await checkInactiveTickets();
    } catch (err) {
      console.error('Cron job error:', err);
    }
  });
  console.log('Daily inactive tickets reminder cron job scheduled.');
}

// ==========================================
// 7. EXPRESS APPLICATION SETUP & ENDPOINTS
// ==========================================
const app = express();

app.use(cors());
app.use(express.json());

// API Base Route
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the Jira Lite Server API' });
});

// AUTH ENDPOINTS
app.post('/api/auth/login', authMiddleware as any, (req: AuthenticatedRequest, res: Response) => {
  res.json({ message: 'Login successful', user: req.user });
});

app.get('/api/auth/profile', authMiddleware as any, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

// USER ENDPOINTS
app.get('/api/users', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await db.select(new Table('user'));
    const usersList = Array.isArray(users) ? users : (users ? [users] : []);
    res.json({ users: usersList });
  } catch (error) {
    console.error('Failed to get users:', error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// TICKET ENDPOINTS
app.get('/api/tickets', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, assigneeId } = req.query;

    let queryStr = 'SELECT * FROM ticket';
    const bindings: any = {};

    if (status) {
      queryStr += ' WHERE status = $status';
      bindings.status = status;
    }

    queryStr += ' ORDER BY created_at DESC FETCH created_by';

    const rawTickets: any = await db.query(queryStr, bindings);
    let tickets = Array.isArray(rawTickets[0]) ? rawTickets[0] : (rawTickets ? [rawTickets] : []);

    for (const ticket of tickets) {
      const rawAssignees: any = await db.query(
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
});

// GET /api/tickets/:id
app.get('/api/tickets/:id', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ticketRecordId = id.startsWith('ticket:') ? id : `ticket:${id}`;

    const rawTicket: any = await db.select(new StringRecordId(ticketRecordId));
    const ticket = Array.isArray(rawTicket) ? rawTicket[0] : rawTicket;

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.created_by) {
      const creatorId = typeof ticket.created_by === 'string' ? ticket.created_by : ticket.created_by.id;
      const rawCreator = await db.select(new StringRecordId(creatorId));
      ticket.created_by = Array.isArray(rawCreator) ? rawCreator[0] : rawCreator;
    }

    // Fetch assignees
    const rawAssignees: any = await db.query(
      'SELECT * FROM ticket_assignee WHERE ticket_id = $ticketId FETCH user_id, assigned_by',
      { ticketId: new StringRecordId(ticketRecordId) }
    );
    ticket.assignees = Array.isArray(rawAssignees[0]) ? rawAssignees[0] : [];

    // Fetch comments
    const rawComments: any = await db.query(
      'SELECT * FROM comment WHERE ticket_id = $ticketId ORDER BY created_at ASC FETCH user_id',
      { ticketId: new StringRecordId(ticketRecordId) }
    );
    ticket.comments = Array.isArray(rawComments[0]) ? rawComments[0] : [];

    res.json({ ticket });
  } catch (error) {
    console.error('Failed to get ticket details:', error);
    res.status(500).json({ error: 'Failed to retrieve ticket' });
  }
});

// POST /api/tickets
app.post('/api/tickets', authMiddleware as any, validate(createTicketSchema) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, status, priority } = req.body;
    const creatorId = req.user!.id;
    const now = new Date().toISOString();

    const rawResult = await db.create(new Table('ticket'), {
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
});

// PUT /api/tickets/:id
app.put('/api/tickets/:id', authMiddleware as any, validate(updateTicketSchema) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority } = req.body;
    const ticketRecordId = id.startsWith('ticket:') ? id : `ticket:${id}`;
    const updaterId = req.user!.id;

    const rawExisting: any = await db.select(new StringRecordId(ticketRecordId));
    const existingTicket = Array.isArray(rawExisting) ? rawExisting[0] : rawExisting;

    if (!existingTicket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const now = new Date().toISOString();
    
    const rawUpdated = await db.merge(new StringRecordId(ticketRecordId), {
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
});

// DELETE /api/tickets/:id
app.delete('/api/tickets/:id', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ticketRecordId = id.startsWith('ticket:') ? id : `ticket:${id}`;

    const rawExisting = await db.select(new StringRecordId(ticketRecordId));
    const existing = Array.isArray(rawExisting) ? rawExisting[0] : rawExisting;

    if (!existing) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    await db.delete(new StringRecordId(ticketRecordId));
    await db.query('DELETE comment WHERE ticket_id = $ticketId', { ticketId: new StringRecordId(ticketRecordId) });
    await db.query('DELETE ticket_assignee WHERE ticket_id = $ticketId', { ticketId: new StringRecordId(ticketRecordId) });
    await db.query('DELETE activity_log WHERE ticket_id = $ticketId', { ticketId: new StringRecordId(ticketRecordId) });

    res.json({ message: 'Ticket and all related logs deleted successfully' });
  } catch (error) {
    console.error('Failed to delete ticket:', error);
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});

// POST /api/tickets/:id/assign
app.post('/api/tickets/:id/assign', authMiddleware as any, validate(assignUserSchema) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const ticketRecordId = id.startsWith('ticket:') ? id : `ticket:${id}`;
    const userRecordId = userId.startsWith('user:') ? userId : `user:${userId}`;
    const assignerId = req.user!.id;

    const rawTicket = await db.select(new StringRecordId(ticketRecordId));
    if (!rawTicket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const rawAssigneeUser = await db.select(new StringRecordId(userRecordId));
    const assigneeUser = Array.isArray(rawAssigneeUser) ? rawAssigneeUser[0] : rawAssigneeUser;
    if (!assigneeUser) {
      return res.status(404).json({ error: 'User to assign not found' });
    }

    const rawExisting: any = await db.query(
      'SELECT * FROM ticket_assignee WHERE ticket_id = $ticketId AND user_id = $userId',
      { ticketId: new StringRecordId(ticketRecordId), userId: new StringRecordId(userRecordId) }
    );
    const existingAssignee = Array.isArray(rawExisting[0]) ? rawExisting[0][0] : null;

    if (existingAssignee) {
      return res.status(400).json({ error: 'User is already assigned to this ticket' });
    }

    const now = new Date().toISOString();
    const rawAssignment = await db.create(new Table('ticket_assignee'), {
      ticket_id: new StringRecordId(ticketRecordId),
      user_id: new StringRecordId(userRecordId),
      assigned_by: new StringRecordId(assignerId),
      assigned_at: now,
    });
    const assignment = Array.isArray(rawAssignment) ? rawAssignment[0] : rawAssignment;

    await logActivity(ticketRecordId, assignerId, 'ASSIGNEE_ADDED', null, assigneeUser.name || assigneeUser.email);
    await db.merge(new StringRecordId(ticketRecordId), { updated_at: now });

    res.status(201).json({ message: 'User assigned successfully', assignment });
  } catch (error) {
    console.error('Failed to assign user:', error);
    res.status(500).json({ error: 'Failed to assign user' });
  }
});

// DELETE /api/tickets/:id/assign/:userId
app.delete('/api/tickets/:id/assign/:userId', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id, userId } = req.params;
    const ticketRecordId = id.startsWith('ticket:') ? id : `ticket:${id}`;
    const userRecordId = userId.startsWith('user:') ? userId : `user:${userId}`;
    const unassignerId = req.user!.id;

    const rawTicket = await db.select(new StringRecordId(ticketRecordId));
    if (!rawTicket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const rawUser = await db.select(new StringRecordId(userRecordId));
    const userToUnassign = Array.isArray(rawUser) ? rawUser[0] : rawUser;
    const userName = userToUnassign ? (userToUnassign.name || userToUnassign.email) : userRecordId;

    const deleteQuery: any = await db.query(
      'DELETE ticket_assignee WHERE ticket_id = $ticketId AND user_id = $userId RETURN BEFORE',
      { ticketId: new StringRecordId(ticketRecordId), userId: new StringRecordId(userRecordId) }
    );
    const deletedList = deleteQuery[0];
    const deletedCount = Array.isArray(deletedList) ? deletedList.length : (deletedList ? 1 : 0);

    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    await logActivity(ticketRecordId, unassignerId, 'ASSIGNEE_REMOVED', userName, null);
    await db.merge(new StringRecordId(ticketRecordId), { updated_at: new Date().toISOString() });

    res.json({ message: 'User unassigned successfully' });
  } catch (error) {
    console.error('Failed to unassign user:', error);
    res.status(500).json({ error: 'Failed to unassign user' });
  }
});

// COMMENT ENDPOINTS
// GET /api/tickets/:id/comments
app.get('/api/tickets/:id/comments', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ticketRecordId = id.startsWith('ticket:') ? id : `ticket:${id}`;

    const rawTicket = await db.select(new StringRecordId(ticketRecordId));
    if (!rawTicket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const rawComments: any = await db.query(
      'SELECT * FROM comment WHERE ticket_id = $ticketId ORDER BY created_at ASC FETCH user_id',
      { ticketId: new StringRecordId(ticketRecordId) }
    );
    const comments = Array.isArray(rawComments[0]) ? rawComments[0] : [];

    res.json({ comments });
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    res.status(500).json({ error: 'Failed to retrieve comments' });
  }
});

// POST /api/tickets/:id/comments
app.post('/api/tickets/:id/comments', authMiddleware as any, validate(commentSchema) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { comment: commentText } = req.body;
    const ticketRecordId = id.startsWith('ticket:') ? id : `ticket:${id}`;
    const authorId = req.user!.id;

    const rawTicket = await db.select(new StringRecordId(ticketRecordId));
    if (!rawTicket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const now = new Date().toISOString();

    const rawComment = await db.create(new Table('comment'), {
      ticket_id: new StringRecordId(ticketRecordId),
      user_id: new StringRecordId(authorId),
      comment: commentText,
      created_at: now,
    });
    const comment = Array.isArray(rawComment) ? rawComment[0] : rawComment;

    await logActivity(ticketRecordId, authorId, 'COMMENT_ADDED', null, commentText);
    await db.merge(new StringRecordId(ticketRecordId), { updated_at: now });

    res.status(201).json({ message: 'Comment added successfully', comment });
  } catch (error) {
    console.error('Failed to add comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// PUT /api/comments/:id
app.put('/api/comments/:id', authMiddleware as any, validate(commentSchema) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { comment: commentText } = req.body;
    const commentRecordId = id.startsWith('comment:') ? id : `comment:${id}`;
    const userId = req.user!.id;

    const rawComment: any = await db.select(new StringRecordId(commentRecordId));
    const existingComment = Array.isArray(rawComment) ? rawComment[0] : rawComment;

    if (!existingComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const commentAuthorId = typeof existingComment.user_id === 'string' 
      ? existingComment.user_id 
      : existingComment.user_id.id;

    if (commentAuthorId !== userId) {
      return res.status(403).json({ error: 'Forbidden: You can only edit your own comments' });
    }

    const rawUpdated = await db.merge(new StringRecordId(commentRecordId), {
      comment: commentText,
    });
    const updatedComment = Array.isArray(rawUpdated) ? rawUpdated[0] : rawUpdated;

    const ticketId = typeof existingComment.ticket_id === 'string'
      ? existingComment.ticket_id
      : existingComment.ticket_id.id;
    await db.merge(new StringRecordId(ticketId), { updated_at: new Date().toISOString() });

    res.json({ message: 'Comment updated successfully', comment: updatedComment });
  } catch (error) {
    console.error('Failed to update comment:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// DELETE /api/comments/:id
app.delete('/api/comments/:id', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const commentRecordId = id.startsWith('comment:') ? id : `comment:${id}`;
    const userId = req.user!.id;

    const rawComment: any = await db.select(new StringRecordId(commentRecordId));
    const existingComment = Array.isArray(rawComment) ? rawComment[0] : rawComment;

    if (!existingComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const commentAuthorId = typeof existingComment.user_id === 'string'
      ? existingComment.user_id
      : existingComment.user_id.id;

    if (commentAuthorId !== userId) {
      return res.status(403).json({ error: 'Forbidden: You can only delete your own comments' });
    }

    await db.delete(new StringRecordId(commentRecordId));

    const ticketId = typeof existingComment.ticket_id === 'string'
      ? existingComment.ticket_id
      : existingComment.ticket_id.id;
    await db.merge(new StringRecordId(ticketId), { updated_at: new Date().toISOString() });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Failed to delete comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// TICKET ACTIVITY LOGS
// GET /api/tickets/:id/activity
app.get('/api/tickets/:id/activity', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ticketRecordId = id.startsWith('ticket:') ? id : `ticket:${id}`;

    const rawTicket = await db.select(new StringRecordId(ticketRecordId));
    if (!rawTicket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const rawLogs: any = await db.query(
      'SELECT * FROM activity_log WHERE ticket_id = $ticketId ORDER BY created_at DESC FETCH user_id',
      { ticketId: new StringRecordId(ticketRecordId) }
    );
    const logs = Array.isArray(rawLogs[0]) ? rawLogs[0] : [];

    res.json({ logs });
  } catch (error) {
    console.error('Failed to fetch activity logs:', error);
    res.status(500).json({ error: 'Failed to retrieve activity log' });
  }
});

// DEV ENDPOINT TO MANUALLY TRIGGER INACTIVE TICKETS CRON REMINDERS
app.post('/api/tickets/dev/trigger-reminders', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const count = await checkInactiveTickets();
    res.json({ message: 'Reminders triggered successfully', processed_tickets_count: count });
  } catch (error) {
    console.error('Failed to trigger reminders manually:', error);
    res.status(500).json({ error: 'Failed to process reminders manually' });
  }
});

// GLOBAL ERROR MIDDLEWARE
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
});

// ==========================================
// 8. SERVER STARTUP
// ==========================================
async function startServer() {
  await connectDB();
  startReminderCron();

  app.listen(PORT, () => {
    console.log(`Jira Lite unified server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer().catch((error) => {
  console.error('Fatal error starting server:', error);
  process.exit(1);
});
