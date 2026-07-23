import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';

export async function loginHandler(req: AuthenticatedRequest, res: Response) {
  res.json({ message: 'Login successful', user: req.user });
}

export async function profileHandler(req: AuthenticatedRequest, res: Response) {
  res.json({ user: req.user });
}
