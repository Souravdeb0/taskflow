import { Request, Response, NextFunction } from 'express';
import db from '../config/db.js';
import { firebaseInitialized, admin } from '../config/firebase.js';

// Extend Express Request type to include user
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
      // Development bypass mode check
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

    // In SurrealDB, records are identified by table:id (e.g. user:uid)
    // We clean the firebaseUid to make sure it contains only valid chars if needed, 
    // but SurrealDB allows most characters, including dots, dashes, underscores, etc.
    const recordId = `user:${firebaseUid}`;
    
    // Select the user record
    const result = await db.select(recordId);
    let user = Array.isArray(result) ? result[0] : result;

    if (!user) {
      const defaultRole = 'Member';
      
      // Create user if they don't exist
      const createResult = await db.create(recordId, {
        name,
        email,
        firebaseUid,
        role: defaultRole,
        created_at: new Date().toISOString()
      });
      user = Array.isArray(createResult) ? createResult[0] : createResult;
      console.log(`Synchronized new user in SurrealDB: ${recordId}`);
    }

    req.user = {
      id: recordId,
      firebaseUid,
      email: email || '',
      name: name || '',
      role: user.role || 'Member'
    };

    next();
  } catch (error) {
    console.error('Error in auth middleware:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
