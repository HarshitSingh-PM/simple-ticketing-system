import { query } from '../config/database';

export const logTicketHistory = async (
  ticketId: number,
  changedBy: number,
  changeType: string,
  fieldName: string | null,
  oldValue: string | null,
  newValue: string | null,
  description: string | null = null
) => {
  try {
    await query(
      `INSERT INTO ticket_history (ticket_id, changed_by, change_type, field_name, old_value, new_value, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [ticketId, changedBy, changeType, fieldName, oldValue, newValue, description]
    );
  } catch (error) {
    console.error('Error logging ticket history:', error);
  }
};

export const getTicketHistory = async (ticketId: number) => {
  const result = await query(
    `SELECT
      th.*,
      u.name as changer_name,
      d.name as changer_department
    FROM ticket_history th
    JOIN users u ON th.changed_by = u.id
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE th.ticket_id = $1
    ORDER BY th.created_at DESC`,
    [ticketId]
  );

  return result.rows;
};
