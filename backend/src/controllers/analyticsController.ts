import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(`
      SELECT
        d.id as department_id,
        d.name as department_name,
        COUNT(CASE WHEN t.status IN ('Open', 'Pending') THEN 1 END) as open_tickets,
        COUNT(CASE WHEN t.status = 'Closed' THEN 1 END) as closed_tickets,
        COUNT(CASE WHEN t.status = 'Closed' AND t.closed_at <= t.deadline THEN 1 END) as closed_on_time,
        COUNT(CASE WHEN t.status = 'Closed' AND t.closed_at > t.deadline THEN 1 END) as closed_delayed
      FROM departments d
      LEFT JOIN tickets t ON t.assigned_department_id = d.id
      GROUP BY d.id, d.name
      ORDER BY d.name
    `);

    return res.json(result.rows);
  } catch (error) {
    console.error('Get analytics error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
