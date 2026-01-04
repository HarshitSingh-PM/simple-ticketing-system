import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAllDepartments = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query('SELECT * FROM departments ORDER BY name ASC');

    return res.json(result.rows);
  } catch (error) {
    console.error('Get all departments error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const createDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Department name is required' });
    }

    const existingDept = await query('SELECT id FROM departments WHERE name = $1', [name]);

    if (existingDept.rows.length > 0) {
      return res.status(400).json({ error: 'Department already exists' });
    }

    const result = await query(
      'INSERT INTO departments (name) VALUES ($1) RETURNING *',
      [name]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create department error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUsersByDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const { departmentId } = req.params;

    const result = await query(
      `SELECT id, name, email, is_active
       FROM users
       WHERE department_id = $1 AND is_active = TRUE
       ORDER BY name ASC`,
      [departmentId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('Get users by department error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
