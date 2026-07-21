import { Response } from 'express';
import db from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function getUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const users = await db.select('user');
    // SurrealDB select(table) returns an array. If it's single, make it array.
    const usersList = Array.isArray(users) ? users : (users ? [users] : []);
    res.json({ users: usersList });
  } catch (error) {
    console.error('Failed to retrieve users:', error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
}
