import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { CreateTicketRequest, UpdateTicketRequest, TicketWithDetails } from '../models/types';
import {
  sendTicketAssignedEmail,
  sendTicketReassignedEmail,
  sendTicketClosedEmail,
} from '../services/emailService';
import { logTicketHistory, getTicketHistory } from '../utils/ticketHistory';

const getTicketWithDetails = async (ticketId: number): Promise<TicketWithDetails | null> => {
  const result = await query(
    `SELECT
      t.*,
      u.name as creator_name,
      u.email as creator_email,
      d.name as department_name
    FROM tickets t
    JOIN users u ON t.created_by = u.id
    JOIN departments d ON t.assigned_department_id = d.id
    WHERE t.id = $1`,
    [ticketId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
};

const getDepartmentUserEmails = async (departmentId: number): Promise<string[]> => {
  const result = await query(
    'SELECT email FROM users WHERE department_id = $1 AND is_active = TRUE',
    [departmentId]
  );
  return result.rows.map(row => row.email);
};

export const getAllTickets = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(
      `SELECT
        t.*,
        u.name as creator_name,
        u.email as creator_email,
        d.name as department_name
      FROM tickets t
      JOIN users u ON t.created_by = u.id
      JOIN departments d ON t.assigned_department_id = d.id
      ORDER BY t.created_at DESC`
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('Get all tickets error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTicketsByStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.params;

    let statusFilter: string;

    if (status === 'open') {
      statusFilter = "status IN ('Open', 'Pending')";
    } else if (status === 'closed') {
      statusFilter = "status = 'Closed'";
    } else {
      return res.status(400).json({ error: 'Invalid status filter' });
    }

    const result = await query(
      `SELECT
        t.*,
        u.name as creator_name,
        u.email as creator_email,
        d.name as department_name
      FROM tickets t
      JOIN users u ON t.created_by = u.id
      JOIN departments d ON t.assigned_department_id = d.id
      WHERE ${statusFilter}
      ORDER BY t.created_at DESC`
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('Get tickets by status error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyDepartmentTickets = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userResult = await query('SELECT department_id FROM users WHERE id = $1', [userId]);

    if (userResult.rows.length === 0 || !userResult.rows[0].department_id) {
      return res.json([]);
    }

    const departmentId = userResult.rows[0].department_id;

    const result = await query(
      `SELECT
        t.*,
        u.name as creator_name,
        u.email as creator_email,
        d.name as department_name
      FROM tickets t
      JOIN users u ON t.created_by = u.id
      JOIN departments d ON t.assigned_department_id = d.id
      WHERE t.assigned_department_id = $1
      ORDER BY t.created_at DESC`,
      [departmentId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('Get my department tickets error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTicketById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const ticket = await getTicketWithDetails(parseInt(id));

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    return res.json(ticket);
  } catch (error) {
    console.error('Get ticket by ID error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const createTicket = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      title,
      description,
      assigned_department_id,
      deadline,
      customer_name,
      customer_mobile,
      car_bought
    }: CreateTicketRequest = req.body;

    const description_image_url = req.file ? `/uploads/${req.file.filename}` : null;

    if (!title || !description || !assigned_department_id) {
      return res.status(400).json({
        error: 'Title, description, and assigned department are required',
      });
    }

    const deptCheck = await query('SELECT id FROM departments WHERE id = $1', [
      assigned_department_id,
    ]);

    if (deptCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid department ID' });
    }

    const ticketDeadline = deadline
      ? new Date(deadline)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);

    const result = await query(
      `INSERT INTO tickets (title, description, description_image_url, created_by, assigned_department_id, deadline, customer_name, customer_mobile, car_bought)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [title, description, description_image_url || null, userId, assigned_department_id, ticketDeadline, customer_name || null, customer_mobile || null, car_bought || null]
    );

    const ticketId = result.rows[0].id;

    const ticket = await getTicketWithDetails(ticketId);

    if (ticket) {
      const departmentEmails = await getDepartmentUserEmails(assigned_department_id);
      if (departmentEmails.length > 0) {
        await sendTicketAssignedEmail(departmentEmails, ticket);
      }

      // Log ticket creation
      await logTicketHistory(
        ticketId,
        userId,
        'created',
        null,
        null,
        null,
        `Ticket created and assigned to ${ticket.department_name}`
      );
    }

    return res.status(201).json(ticket);
  } catch (error) {
    console.error('Create ticket error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTicketHistoryById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const history = await getTicketHistory(parseInt(id));

    return res.json(history);
  } catch (error) {
    console.error('Get ticket history error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const isAdmin = req.user?.isAdmin;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      title,
      description,
      description_image_url,
      status,
      assigned_department_id,
      deadline,
      customer_name,
      customer_mobile,
      car_bought
    }: UpdateTicketRequest = req.body;

    const ticketCheck = await query(
      'SELECT * FROM tickets WHERE id = $1',
      [id]
    );

    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const currentTicket = ticketCheck.rows[0];

    if (deadline !== undefined) {
      if (!isAdmin && currentTicket.created_by !== userId) {
        return res.status(403).json({
          error: 'Only admin or ticket creator can modify deadline',
        });
      }
    }

    if (description !== undefined || description_image_url !== undefined) {
      if (!isAdmin) {
        return res.status(403).json({
          error: 'Only admin can modify ticket description',
        });
      }
    }

    if (assigned_department_id && assigned_department_id !== currentTicket.assigned_department_id) {
      const deptCheck = await query('SELECT id FROM departments WHERE id = $1', [
        assigned_department_id,
      ]);

      if (deptCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid department ID' });
      }
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (description_image_url !== undefined) {
      updates.push(`description_image_url = $${paramCount++}`);
      values.push(description_image_url);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(status);

      if (status === 'Closed' && currentTicket.status !== 'Closed') {
        updates.push(`closed_at = CURRENT_TIMESTAMP`);
      }
    }
    if (assigned_department_id !== undefined) {
      updates.push(`assigned_department_id = $${paramCount++}`);
      values.push(assigned_department_id);
    }
    if (deadline !== undefined) {
      updates.push(`deadline = $${paramCount++}`);
      values.push(deadline);
    }
    if (customer_name !== undefined) {
      updates.push(`customer_name = $${paramCount++}`);
      values.push(customer_name);
    }
    if (customer_mobile !== undefined) {
      updates.push(`customer_mobile = $${paramCount++}`);
      values.push(customer_mobile);
    }
    if (car_bought !== undefined) {
      updates.push(`car_bought = $${paramCount++}`);
      values.push(car_bought);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    await query(
      `UPDATE tickets SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      values
    );

    const updatedTicket = await getTicketWithDetails(parseInt(id));

    // Log all changes to ticket history
    if (updatedTicket) {
      if (title !== undefined && title !== currentTicket.title) {
        await logTicketHistory(
          parseInt(id),
          userId,
          'field_updated',
          'title',
          currentTicket.title,
          title,
          null
        );
      }

      if (description !== undefined && description !== currentTicket.description) {
        await logTicketHistory(
          parseInt(id),
          userId,
          'field_updated',
          'description',
          currentTicket.description,
          description,
          null
        );
      }

      if (description_image_url !== undefined && description_image_url !== currentTicket.description_image_url) {
        await logTicketHistory(
          parseInt(id),
          userId,
          'field_updated',
          'description_image_url',
          currentTicket.description_image_url,
          description_image_url,
          'Description image updated'
        );
      }

      if (status !== undefined && status !== currentTicket.status) {
        await logTicketHistory(
          parseInt(id),
          userId,
          'status_changed',
          'status',
          currentTicket.status,
          status,
          `Status changed from ${currentTicket.status} to ${status}`
        );
      }

      if (assigned_department_id && assigned_department_id !== currentTicket.assigned_department_id) {
        const oldDeptResult = await query('SELECT name FROM departments WHERE id = $1', [currentTicket.assigned_department_id]);
        const newDeptResult = await query('SELECT name FROM departments WHERE id = $1', [assigned_department_id]);
        await logTicketHistory(
          parseInt(id),
          userId,
          'reassigned',
          'assigned_department_id',
          oldDeptResult.rows[0]?.name || currentTicket.assigned_department_id.toString(),
          newDeptResult.rows[0]?.name || assigned_department_id.toString(),
          `Ticket reassigned from ${oldDeptResult.rows[0]?.name} to ${newDeptResult.rows[0]?.name}`
        );
      }

      if (deadline !== undefined && deadline !== currentTicket.deadline) {
        await logTicketHistory(
          parseInt(id),
          userId,
          'field_updated',
          'deadline',
          currentTicket.deadline?.toString() || null,
          deadline?.toString() || null,
          'Deadline modified'
        );
      }

      if (customer_name !== undefined && customer_name !== currentTicket.customer_name) {
        await logTicketHistory(
          parseInt(id),
          userId,
          'field_updated',
          'customer_name',
          currentTicket.customer_name,
          customer_name,
          null
        );
      }

      if (customer_mobile !== undefined && customer_mobile !== currentTicket.customer_mobile) {
        await logTicketHistory(
          parseInt(id),
          userId,
          'field_updated',
          'customer_mobile',
          currentTicket.customer_mobile,
          customer_mobile,
          null
        );
      }

      if (car_bought !== undefined && car_bought !== currentTicket.car_bought) {
        await logTicketHistory(
          parseInt(id),
          userId,
          'field_updated',
          'car_bought',
          currentTicket.car_bought,
          car_bought,
          null
        );
      }
    }

    if (updatedTicket) {
      if (assigned_department_id && assigned_department_id !== currentTicket.assigned_department_id) {
        const departmentEmails = await getDepartmentUserEmails(assigned_department_id);
        if (departmentEmails.length > 0) {
          await sendTicketReassignedEmail(departmentEmails, updatedTicket);
        }
      }

      if (status === 'Closed' && currentTicket.status !== 'Closed') {
        await sendTicketClosedEmail(updatedTicket.creator_email, updatedTicket);
      }
    }

    return res.json(updatedTicket);
  } catch (error) {
    console.error('Update ticket error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
