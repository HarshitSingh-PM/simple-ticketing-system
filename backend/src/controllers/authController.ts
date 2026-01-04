import { Response } from 'express';
import { query } from '../config/database';
import { comparePassword, generateToken, hashPassword } from '../utils/auth';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/types';

export const login = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user: User = result.rows[0];

    const isValidPassword = await comparePassword(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      isAdmin: user.is_admin,
    });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.is_admin,
        mustChangePassword: user.must_change_password,
        departmentId: user.department_id,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const result = await query('SELECT * FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user: User = result.rows[0];

    const isValidPassword = await comparePassword(currentPassword, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newPasswordHash = await hashPassword(newPassword);

    await query(
      'UPDATE users SET password_hash = $1, must_change_password = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    return res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await query(
      'SELECT id, name, email, is_admin, must_change_password, department_id, is_active FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.is_admin,
      mustChangePassword: user.must_change_password,
      departmentId: user.department_id,
      isActive: user.is_active,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
