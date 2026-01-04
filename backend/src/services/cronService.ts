import cron from 'node-cron';
import { query } from '../config/database';
import { sendTicketOverdueEmail } from './emailService';
import { TicketWithDetails } from '../models/types';

const checkOverdueTickets = async () => {
  try {
    console.log('Checking for overdue tickets...');

    const result = await query(
      `SELECT
        t.*,
        u.name as creator_name,
        u.email as creator_email,
        d.name as department_name
      FROM tickets t
      JOIN users u ON t.created_by = u.id
      JOIN departments d ON t.assigned_department_id = d.id
      WHERE t.status != 'Closed'
        AND t.deadline < CURRENT_TIMESTAMP
        AND NOT EXISTS (
          SELECT 1 FROM tickets t2
          WHERE t2.id = t.id
            AND t2.deadline < (CURRENT_TIMESTAMP - INTERVAL '1 minute')
        )`
    );

    if (result.rows.length === 0) {
      console.log('No overdue tickets found');
      return;
    }

    const allUsersResult = await query(
      'SELECT email FROM users WHERE is_active = TRUE'
    );
    const allUserEmails = allUsersResult.rows.map(row => row.email);

    for (const ticketRow of result.rows) {
      const ticket: TicketWithDetails = ticketRow;

      console.log(`Sending overdue notification for ticket #${ticket.id}`);

      if (allUserEmails.length > 0) {
        await sendTicketOverdueEmail(allUserEmails, ticket);
      }
    }

    console.log(`Processed ${result.rows.length} overdue ticket(s)`);
  } catch (error) {
    console.error('Error checking overdue tickets:', error);
  }
};

export const startCronJobs = () => {
  cron.schedule('* * * * *', checkOverdueTickets);

  console.log('Cron jobs started - checking for overdue tickets every minute');
};
