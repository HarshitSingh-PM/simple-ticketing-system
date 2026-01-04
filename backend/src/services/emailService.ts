import nodemailer from 'nodemailer';
import { TicketWithDetails } from '../models/types';

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

export const sendTicketAssignedEmail = async (
  recipientEmails: string[],
  ticket: TicketWithDetails
) => {
  const ticketUrl = `${FRONTEND_URL}/tickets/${ticket.id}`;

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: recipientEmails.join(','),
    subject: `Ticket Assigned: ${ticket.title}`,
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
  } catch (error) {
    console.error('Error sending ticket assigned email:', error);
  }
};

export const sendTicketReassignedEmail = async (
  recipientEmails: string[],
  ticket: TicketWithDetails
) => {
  const ticketUrl = `${FRONTEND_URL}/tickets/${ticket.id}`;

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: recipientEmails.join(','),
    subject: `Ticket Reassigned: ${ticket.title}`,
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
  } catch (error) {
    console.error('Error sending ticket reassigned email:', error);
  }
};

export const sendTicketClosedEmail = async (
  recipientEmail: string,
  ticket: TicketWithDetails
) => {
  const ticketUrl = `${FRONTEND_URL}/tickets/${ticket.id}`;

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: recipientEmail,
    subject: `Ticket Closed: ${ticket.title}`,
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
  } catch (error) {
    console.error('Error sending ticket closed email:', error);
  }
};

export const sendTicketOverdueEmail = async (
  recipientEmails: string[],
  ticket: TicketWithDetails
) => {
  const ticketUrl = `${FRONTEND_URL}/tickets/${ticket.id}`;

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: recipientEmails.join(','),
    subject: `OVERDUE: ${ticket.title}`,
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
  } catch (error) {
    console.error('Error sending ticket overdue email:', error);
  }
};
