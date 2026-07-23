import { Response } from 'express';
import { Table, StringRecordId } from 'surrealdb';
import { safeSelect, safeMerge } from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function getUsersHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const users = await safeSelect(new Table('user'));
    const usersList = Array.isArray(users) ? users : (users ? [users] : []);
    res.json({ users: usersList });
  } catch (error) {
    console.error('Failed to get users:', error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
}

export async function updateUserRoleHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const callerRole = req.user?.role;
    if (callerRole !== 'SuperAdmin' && callerRole !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden: Only SuperAdmins and Admins can modify user roles' });
    }

    const { id } = req.params;
    const { role } = req.body;

    if (!['Admin', 'Manager', 'Employee'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be Admin, Manager, or Employee' });
    }

    const userRecordId = id.startsWith('user:') ? id : `user:${id}`;

    const userRecord = await safeSelect(new StringRecordId(userRecordId));
    if (!userRecord) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Lock and protect the unique SuperAdmin user
    const targetEmail = (userRecord.email || '').toLowerCase().trim();
    if (targetEmail === 'souravdeb803@gmail.com' || userRecord.role === 'SuperAdmin') {
      return res.status(403).json({ error: 'Forbidden: The Super Admin position is unique and cannot be modified' });
    }

    const updatedUser = await safeMerge(new StringRecordId(userRecordId), { role });
    res.json({ message: 'User role updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Failed to update user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
}
