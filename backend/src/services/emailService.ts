import nodemailer from 'nodemailer';
import { TicketWithDetails } from '../models/types';
import { query } from '../config/database';
import { logTicketHistory } from '../utils/ticketHistory';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Helper function to log email to database
const logEmail = async (
  ticketId: number | null,
  emailType: string,
  recipientEmails: string[],
  subject: string,
  sentBy: number | null,
  success: boolean,
  errorMessage: string | null = null
) => {
  try {
    await query(
      `INSERT INTO email_logs (ticket_id, email_type, recipient_emails, subject, sent_by, success, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [ticketId, emailType, recipientEmails.join(', '), subject, sentBy, success, errorMessage]
    );
  } catch (error) {
    console.error('Error logging email:', error);
  }
};

export const sendTicketAssignedEmail = async (
  recipientEmails: string[],
  ticket: TicketWithDetails,
  sentBy: number | null = null
) => {
  const ticketUrl = `${FRONTEND_URL}/tickets/${ticket.id}`;
  const subject = `Ticket Assigned: ${ticket.title}`;

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: recipientEmails.join(','),
    subject: subject,
    html: `
      <h2>New Ticket Assigned to ${ticket.department_name}</h2>
      <p><strong>Ticket ID:</strong> #${ticket.id}</p>
      <p><strong>Title:</strong> ${ticket.title}</p>
      <p><strong>Status:</strong> ${ticket.status}</p>
      <p><strong>Assigned Department:</strong> ${ticket.department_name}</p>
      <p><strong>Deadline:</strong> ${new Date(ticket.deadline).toLocaleString()}</p>
      <p><strong>Description:</strong></p>
      <p>${ticket.description}</p>
      <p><a href="${ticketUrl}">View Ticket</a></p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Ticket assigned email sent to: ${recipientEmails.join(', ')}`);

    // Log email to database
    await logEmail(ticket.id, 'ticket_assigned', recipientEmails, subject, sentBy, true);

    // Add to ticket history
    if (sentBy) {
      await logTicketHistory(
        ticket.id,
        sentBy,
        'email_sent',
        'notification',
        null,
        recipientEmails.join(', '),
        `Assignment notification email sent to ${recipientEmails.length} recipient(s)`
      );
    }
  } catch (error) {
    console.error('Error sending ticket assigned email:', error);

    // Log failed email
    await logEmail(ticket.id, 'ticket_assigned', recipientEmails, subject, sentBy, false, error instanceof Error ? error.message : 'Unknown error');
  }
};

export const sendTicketReassignedEmail = async (
  recipientEmails: string[],
  ticket: TicketWithDetails,
  sentBy: number | null = null
) => {
  const ticketUrl = `${FRONTEND_URL}/tickets/${ticket.id}`;
  const subject = `Ticket Reassigned: ${ticket.title}`;

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: recipientEmails.join(','),
    subject: subject,
    html: `
      <h2>Ticket Reassigned to ${ticket.department_name}</h2>
      <p><strong>Ticket ID:</strong> #${ticket.id}</p>
      <p><strong>Title:</strong> ${ticket.title}</p>
      <p><strong>Status:</strong> ${ticket.status}</p>
      <p><strong>Assigned Department:</strong> ${ticket.department_name}</p>
      <p><strong>Deadline:</strong> ${new Date(ticket.deadline).toLocaleString()}</p>
      <p><strong>Description:</strong></p>
      <p>${ticket.description}</p>
      <p><a href="${ticketUrl}">View Ticket</a></p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Ticket reassigned email sent to: ${recipientEmails.join(', ')}`);

    // Log email to database
    await logEmail(ticket.id, 'ticket_reassigned', recipientEmails, subject, sentBy, true);

    // Add to ticket history
    if (sentBy) {
      await logTicketHistory(
        ticket.id,
        sentBy,
        'email_sent',
        'notification',
        null,
        recipientEmails.join(', '),
        `Reassignment notification email sent to ${recipientEmails.length} recipient(s)`
      );
    }
  } catch (error) {
    console.error('Error sending ticket reassigned email:', error);

    // Log failed email
    await logEmail(ticket.id, 'ticket_reassigned', recipientEmails, subject, sentBy, false, error instanceof Error ? error.message : 'Unknown error');
  }
};

export const sendTicketClosedEmail = async (
  recipientEmail: string,
  ticket: TicketWithDetails,
  sentBy: number | null = null
) => {
  const ticketUrl = `${FRONTEND_URL}/tickets/${ticket.id}`;
  const subject = `Ticket Closed: ${ticket.title}`;

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: recipientEmail,
    subject: subject,
    html: `
      <h2>Your Ticket Has Been Closed</h2>
      <p><strong>Ticket ID:</strong> #${ticket.id}</p>
      <p><strong>Title:</strong> ${ticket.title}</p>
      <p><strong>Status:</strong> ${ticket.status}</p>
      <p><strong>Assigned Department:</strong> ${ticket.department_name}</p>
      <p><strong>Closed At:</strong> ${ticket.closed_at ? new Date(ticket.closed_at).toLocaleString() : 'N/A'}</p>
      <p><a href="${ticketUrl}">View Ticket</a></p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Ticket closed email sent to: ${recipientEmail}`);

    // Log email to database
    await logEmail(ticket.id, 'ticket_closed', [recipientEmail], subject, sentBy, true);

    // Add to ticket history
    if (sentBy) {
      await logTicketHistory(
        ticket.id,
        sentBy,
        'email_sent',
        'notification',
        null,
        recipientEmail,
        `Closure notification email sent to ticket creator`
      );
    }
  } catch (error) {
    console.error('Error sending ticket closed email:', error);

    // Log failed email
    await logEmail(ticket.id, 'ticket_closed', [recipientEmail], subject, sentBy, false, error instanceof Error ? error.message : 'Unknown error');
  }
};

export const sendTicketOverdueEmail = async (
  recipientEmails: string[],
  ticket: TicketWithDetails,
  sentBy: number | null = null
) => {
  const ticketUrl = `${FRONTEND_URL}/tickets/${ticket.id}`;
  const subject = `OVERDUE: ${ticket.title}`;

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: recipientEmails.join(','),
    subject: subject,
    html: `
      <h2 style="color: red;">Ticket Overdue</h2>
      <p><strong>Ticket ID:</strong> #${ticket.id}</p>
      <p><strong>Title:</strong> ${ticket.title}</p>
      <p><strong>Status:</strong> ${ticket.status}</p>
      <p><strong>Assigned Department:</strong> ${ticket.department_name}</p>
      <p><strong>Deadline:</strong> ${new Date(ticket.deadline).toLocaleString()}</p>
      <p><strong>Description:</strong></p>
      <p>${ticket.description}</p>
      <p style="color: red;"><strong>This ticket has passed its deadline and requires immediate attention.</strong></p>
      <p><a href="${ticketUrl}">View Ticket</a></p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Ticket overdue email sent to: ${recipientEmails.join(', ')}`);

    // Log email to database
    await logEmail(ticket.id, 'ticket_overdue', recipientEmails, subject, sentBy, true);

    // Add to ticket history (use system for automated overdue emails)
    if (sentBy) {
      await logTicketHistory(
        ticket.id,
        sentBy,
        'email_sent',
        'notification',
        null,
        recipientEmails.join(', '),
        `Overdue notification email sent to ${recipientEmails.length} recipient(s)`
      );
    }
  } catch (error) {
    console.error('Error sending ticket overdue email:', error);

    // Log failed email
    await logEmail(ticket.id, 'ticket_overdue', recipientEmails, subject, sentBy, false, error instanceof Error ? error.message : 'Unknown error');
  }
};
