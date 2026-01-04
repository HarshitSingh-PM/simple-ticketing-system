import { Response } from 'express';
import { query } from '../config/database';
import { hashPassword } from '../utils/auth';
import { AuthRequest } from '../middleware/auth';
import { CreateUserRequest, UpdateUserRequest } from '../models/types';

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(`
      SELECT
        u.id, u.name, u.email, u.is_admin, u.is_active, u.department_id,
        u.created_at, u.updated_at, d.name as department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      ORDER BY u.created_at DESC
    `);

    const users = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      isAdmin: row.is_admin,
      isActive: row.is_active,
      departmentId: row.department_id,
      departmentName: row.department_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, is_admin, department_id }: CreateUserRequest = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    if (department_id) {
      const deptCheck = await query('SELECT id FROM departments WHERE id = $1', [department_id]);
      if (deptCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid department ID' });
      }
    }

    const passwordHash = await hashPassword(password);

    const result = await query(
      `INSERT INTO users (name, email, password_hash, is_admin, department_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, is_admin, is_active, department_id, created_at`,
      [name, email, passwordHash, is_admin || false, department_id || null]
    );

    const user = result.rows[0];

    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.is_admin,
      isActive: user.is_active,
      departmentId: user.department_id,
      createdAt: user.created_at,
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, is_active, department_id }: UpdateUserRequest = req.body;

    const userCheck = await query('SELECT id FROM users WHERE id = $1', [id]);

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (email) {
      const emailCheck = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [
        email,
        id,
      ]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    if (department_id) {
      const deptCheck = await query('SELECT id FROM departments WHERE id = $1', [department_id]);
      if (deptCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid department ID' });
      }
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }
    if (department_id !== undefined) {
      updates.push(`department_id = $${paramCount++}`);
      values.push(department_id);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, name, email, is_admin, is_active, department_id, updated_at`,
      values
    );

    const user = result.rows[0];

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.is_admin,
      isActive: user.is_active,
      departmentId: user.department_id,
      updatedAt: user.updated_at,
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deactivateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const userCheck = await query('SELECT id, is_admin FROM users WHERE id = $1', [id]);

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await query(
      'UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    return res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Deactivate user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
