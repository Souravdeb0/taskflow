import { Response } from 'express';
import { Table, StringRecordId } from 'surrealdb';
import { db, safeQuery, safeSelect, safeMerge } from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { logActivity } from '../services/activityService.js';

export async function getCommentsHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const ticketRecordId = id.startsWith('ticket:') ? id : `ticket:${id}`;

    const rawTicket = await safeSelect(new StringRecordId(ticketRecordId));
    if (!rawTicket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const rawComments: any = await safeQuery(
      'SELECT * FROM comment WHERE ticket_id = $ticketId ORDER BY created_at ASC FETCH user_id',
      { ticketId: new StringRecordId(ticketRecordId) }
    );
    const comments = Array.isArray(rawComments[0]) ? rawComments[0] : [];

    res.json({ comments });
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    res.status(500).json({ error: 'Failed to retrieve comments' });
  }
}

export async function addCommentHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { comment: commentText } = req.body;
    const ticketRecordId = id.startsWith('ticket:') ? id : `ticket:${id}`;
    const authorId = req.user!.id;

    const rawTicket = await safeSelect(new StringRecordId(ticketRecordId));
    if (!rawTicket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const now = new Date().toISOString();

    const rawComment = await (db as any).create(new Table('comment'), {
      ticket_id: new StringRecordId(ticketRecordId),
      user_id: new StringRecordId(authorId),
      comment: commentText,
      created_at: now,
    });
    const comment = Array.isArray(rawComment) ? rawComment[0] : rawComment;

    await logActivity(ticketRecordId, authorId, 'COMMENT_ADDED', null, commentText);
    await safeMerge(new StringRecordId(ticketRecordId), { updated_at: now });

    res.status(201).json({ message: 'Comment added successfully', comment });
  } catch (error) {
    console.error('Failed to add comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
}

export async function updateCommentHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { comment: commentText } = req.body;
    const commentRecordId = id.startsWith('comment:') ? id : `comment:${id}`;
    const userId = req.user!.id;

    const rawComment: any = await safeSelect(new StringRecordId(commentRecordId));
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

    const rawUpdated = await safeMerge(new StringRecordId(commentRecordId), {
      comment: commentText,
    });
    const updatedComment = Array.isArray(rawUpdated) ? rawUpdated[0] : rawUpdated;

    const ticketId = typeof existingComment.ticket_id === 'string'
      ? existingComment.ticket_id
      : existingComment.ticket_id.id;
    await safeMerge(new StringRecordId(ticketId), { updated_at: new Date().toISOString() });

    res.json({ message: 'Comment updated successfully', comment: updatedComment });
  } catch (error) {
    console.error('Failed to update comment:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
}

export async function deleteCommentHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const commentRecordId = id.startsWith('comment:') ? id : `comment:${id}`;
    const userId = req.user!.id;

    const rawComment: any = await safeSelect(new StringRecordId(commentRecordId));
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
    await safeMerge(new StringRecordId(ticketId), { updated_at: new Date().toISOString() });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Failed to delete comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
}
