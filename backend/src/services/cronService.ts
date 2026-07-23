import cron from 'node-cron';
import { StringRecordId } from 'surrealdb';
import { safeQuery } from '../config/db.js';
import { sendEmail } from './emailService.js';

export async function checkInactiveTickets() {
  console.log('Running daily inactive tickets check...');
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoffStr = sevenDaysAgo.toISOString();

    // Query tickets not Done that haven't been updated in 7 days
    const rawTickets: any = await safeQuery(
      'SELECT * FROM ticket WHERE status != "Done" AND updated_at < $cutoff',
      { cutoff: cutoffStr }
    );
    const inactiveTickets = Array.isArray(rawTickets[0]) ? rawTickets[0] : [];

    console.log(`Found ${inactiveTickets.length} inactive tickets.`);

    for (const ticket of inactiveTickets) {
      // Find assignees
      const rawAssignees: any = await safeQuery(
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
      console.error('Scheduled inactivity check failed:', err);
    }
  });
  console.log('Daily inactive tickets reminder cron job scheduled.');
}
