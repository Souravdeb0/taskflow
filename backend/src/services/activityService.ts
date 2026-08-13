import { StringRecordId } from 'surrealdb';
import { safeQuery } from '../config/db.js';

export async function logActivity(
  ticketId: any,
  userId: any,
  action: string,
  oldValue: string | null = null,
  newValue: string | null = null
) {
  try {
    const tStr = typeof ticketId === 'string' ? ticketId : (ticketId?.id || ticketId?.toString() || '');
    const uStr = typeof userId === 'string' ? userId : (userId?.id || userId?.toString() || '');

    const ticketRecord = tStr.startsWith('ticket:') ? tStr : `ticket:${tStr}`;
    const userRecord = uStr.startsWith('user:') ? uStr : `user:${uStr}`;

    await safeQuery('CREATE activity_log CONTENT $data', { data: {
      ticket_id: new StringRecordId(ticketRecord),
      user_id: new StringRecordId(userRecord),
      action,
      old_value: oldValue,
      new_value: newValue,
      created_at: new Date().toISOString(),
    }});
  } catch (error) {
    console.error('Failed to log activity in SurrealDB:', error);
  }
}
