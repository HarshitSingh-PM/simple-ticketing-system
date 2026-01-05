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

export const getEmailStats = async (req: AuthRequest, res: Response) => {
  try {
    // Get total emails sent today
    const todayResult = await query(`
      SELECT COUNT(*) as count
      FROM email_logs
      WHERE DATE(sent_at) = CURRENT_DATE
    `);

    // Get total emails sent this month
    const monthResult = await query(`
      SELECT COUNT(*) as count
      FROM email_logs
      WHERE DATE_TRUNC('month', sent_at) = DATE_TRUNC('month', CURRENT_DATE)
    `);

    // Get email breakdown by type for today
    const todayByTypeResult = await query(`
      SELECT email_type, COUNT(*) as count
      FROM email_logs
      WHERE DATE(sent_at) = CURRENT_DATE
      GROUP BY email_type
      ORDER BY count DESC
    `);

    // Get email breakdown by type for this month
    const monthByTypeResult = await query(`
      SELECT email_type, COUNT(*) as count
      FROM email_logs
      WHERE DATE_TRUNC('month', sent_at) = DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY email_type
      ORDER BY count DESC
    `);

    // Get success/failure stats
    const successStatsResult = await query(`
      SELECT
        COUNT(CASE WHEN success = TRUE THEN 1 END) as successful_today,
        COUNT(CASE WHEN success = FALSE THEN 1 END) as failed_today
      FROM email_logs
      WHERE DATE(sent_at) = CURRENT_DATE
    `);

    return res.json({
      today: {
        total: parseInt(todayResult.rows[0].count),
        byType: todayByTypeResult.rows,
        successful: parseInt(successStatsResult.rows[0].successful_today || 0),
        failed: parseInt(successStatsResult.rows[0].failed_today || 0)
      },
      month: {
        total: parseInt(monthResult.rows[0].count),
        byType: monthByTypeResult.rows
      }
    });
  } catch (error) {
    console.error('Get email stats error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
