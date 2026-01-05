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

export const sendUserWelcomeEmail = async (
  recipientEmail: string,
  userName: string,
  userPassword: string,
  createdBy: number | null = null
) => {
  const loginUrl = `${FRONTEND_URL}/login`;
  const subject = `Welcome to the Ticketing System`;

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: recipientEmail,
    subject: subject,
    html: `
      <h2>Welcome to the Ticketing System!</h2>
      <p>Hello <strong>${userName}</strong>,</p>
      <p>Your account has been created successfully. You can now login to the ticketing system using the credentials below:</p>

      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Email:</strong> ${recipientEmail}</p>
        <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${userPassword}</p>
        <p style="margin: 5px 0;"><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
      </div>

      <p><strong style="color: #856404;">⚠️ Important:</strong> For security reasons, please change your password after your first login.</p>

      <p>If you have any questions or need assistance, please contact your system administrator.</p>

      <p>Best regards,<br>Ticketing System Team</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to: ${recipientEmail}`);

    // Log email to database
    await logEmail(null, 'user_welcome', [recipientEmail], subject, createdBy, true);
  } catch (error) {
    console.error('Error sending welcome email:', error);

    // Log failed email
    await logEmail(null, 'user_welcome', [recipientEmail], subject, createdBy, false, error instanceof Error ? error.message : 'Unknown error');
  }
};
