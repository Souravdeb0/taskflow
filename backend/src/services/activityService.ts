import db from '../config/db.js';

export async function logActivity(
  ticketId: string,
  userId: string,
  action: string,
  oldValue: string | null = null,
  newValue: string | null = null
) {
  try {
    // Ensure ids are proper SurrealDB Record IDs
    const ticketRecord = ticketId.startsWith('ticket:') ? ticketId : `ticket:${ticketId}`;
    const userRecord = userId.startsWith('user:') ? userId : `user:${userId}`;

    const activity = await db.create('activity_log', {
      ticket_id: ticketRecord,
      user_id: userRecord,
      action,
      old_value: oldValue,
      new_value: newValue,
      created_at: new Date().toISOString()
    });
    
    return activity;
  } catch (error) {
    console.error('Failed to log activity in SurrealDB:', error);
    return null;
  }
}
