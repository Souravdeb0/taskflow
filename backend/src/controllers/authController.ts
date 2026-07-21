import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function login(req: AuthenticatedRequest, res: Response) {
  try {
    res.json({ message: 'Login successful', user: req.user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process login' });
  }
}

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}
