import { Request, Response, NextFunction } from 'express';
import { StringRecordId } from 'surrealdb';
import admin, { firebaseInitialized } from '../config/firebase.js';
import { db, safeSelect, safeMerge } from '../config/db.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string; // user:uid
    firebaseUid: string;
    email: string;
    name: string;
    role: string;
  };
}

function decodeJwtLocally(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    return {
      uid: payload.user_id || payload.sub,
      email: payload.email || '',
      name: payload.name || payload.email?.split('@')[0] || 'Firebase User',
    };
  } catch (e) {
    return null;
  }
}

const tokenTimeout = (ms: number) =>
  new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), ms)
  );

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    let firebaseUid: string | null = null;
    let email: string | null = null;
    let name: string | null = null;

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    const mockUid = req.headers['x-mock-user-uid'] as string;
    const mockEmail = req.headers['x-mock-user-email'] as string;
    const mockName = req.headers['x-mock-user-name'] as string;

    if (firebaseInitialized && token) {
      try {
        const decodedToken = await Promise.race([
          admin.auth().verifyIdToken(token),
          tokenTimeout(2500) as any
        ]);
        firebaseUid = decodedToken.uid;
        email = decodedToken.email || '';
        name = decodedToken.name || (email || '').split('@')[0];
      } catch (error) {
        console.warn('Firebase token verification timed out or failed. Decoding locally:', error);
        const decoded = decodeJwtLocally(token);
        if (decoded) {
          firebaseUid = decoded.uid;
          email = decoded.email;
          name = decoded.name;
        } else {
          console.error('Local JWT decoding failed:', error);
          return res.status(401).json({ error: 'Unauthorized: Invalid Firebase token' });
        }
      }
    } else if (mockUid) {
      firebaseUid = mockUid;
      email = mockEmail || `${mockUid}@example.com`;
      name = mockName || mockUid;
    }

    if (!firebaseUid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const recordId = `user:${firebaseUid}`;
    
    // Select the user record safely
    let userRecord = await safeSelect(new StringRecordId(recordId));
    userRecord = Array.isArray(userRecord) ? userRecord[0] : userRecord;

    if (!userRecord) {
      // Assign roles dynamically
      let defaultRole = 'Employee';
      const normalizedEmail = (email || '').toLowerCase().trim();
      if (normalizedEmail === 'souravdeb803@gmail.com') {
        defaultRole = 'SuperAdmin';
      } else if (firebaseUid === 'alice_uid') {
        defaultRole = 'Admin';
      } else if (firebaseUid === 'charlie_uid') {
        defaultRole = 'Manager';
      } else if (firebaseUid === 'bob_uid') {
        defaultRole = 'Employee';
      }
      
      // Create user if they don't exist
      const createResult = await (db as any).create(new StringRecordId(recordId), {
        name,
        email,
        firebaseUid,
        role: defaultRole,
        created_at: new Date().toISOString()
      });
      userRecord = Array.isArray(createResult) ? createResult[0] : createResult;
      console.log(`Synchronized new user in SurrealDB: ${recordId} with role ${defaultRole}`);
    } else {
      // Ensure demo accounts and super admin always have correct roles in database
      let targetRole = userRecord.role;
      const normalizedEmail = (userRecord.email || email || '').toLowerCase().trim();
      if (normalizedEmail === 'souravdeb803@gmail.com') {
        targetRole = 'SuperAdmin';
      } else if (firebaseUid === 'alice_uid') {
        targetRole = 'Admin';
      } else if (firebaseUid === 'charlie_uid') {
        targetRole = 'Manager';
      } else if (firebaseUid === 'bob_uid') {
        targetRole = 'Employee';
      }

      if (userRecord.role !== targetRole) {
        const updateResult = await safeMerge(new StringRecordId(recordId), { role: targetRole });
        userRecord = Array.isArray(updateResult) ? updateResult[0] : updateResult;
        console.log(`Updated role for user ${recordId} to ${targetRole}`);
      }
    }

    req.user = {
      id: recordId,
      firebaseUid,
      email: userRecord.email || email,
      name: userRecord.name || name,
      role: userRecord.role || 'Employee',
    };

    next();
  } catch (error) {
    console.error('Error in auth middleware:', error);
    res.status(500).json({ error: 'Internal Server Error during authentication' });
  }
}
