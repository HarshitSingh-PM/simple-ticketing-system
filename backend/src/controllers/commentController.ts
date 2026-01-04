import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { CreateCommentRequest, TicketCommentWithDetails } from '../models/types';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../../uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and GIF images are allowed.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export const getCommentsByTicketId = async (req: AuthRequest, res: Response) => {
  try {
    const { ticketId } = req.params;

    const result = await query(
      `SELECT
        c.*,
        u.name as user_name,
        d.name as user_department
      FROM ticket_comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE c.ticket_id = $1
      ORDER BY c.created_at ASC`,
      [ticketId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('Get comments error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const createComment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { ticket_id, comment_text }: CreateCommentRequest = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    if (!ticket_id || !comment_text) {
      return res.status(400).json({ error: 'Ticket ID and comment text are required' });
    }

    // Verify ticket exists
    const ticketCheck = await query('SELECT id FROM tickets WHERE id = $1', [ticket_id]);
    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const result = await query(
      `INSERT INTO ticket_comments (ticket_id, user_id, comment_text, image_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [ticket_id, userId, comment_text, image_url]
    );

    const commentId = result.rows[0].id;

    // Fetch the complete comment with user details
    const commentResult = await query(
      `SELECT
        c.*,
        u.name as user_name,
        d.name as user_department
      FROM ticket_comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE c.id = $1`,
      [commentId]
    );

    return res.status(201).json(commentResult.rows[0]);
  } catch (error) {
    console.error('Create comment error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateComment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { comment_text } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!comment_text) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    // Check if comment exists and user is the owner
    const commentCheck = await query('SELECT user_id FROM ticket_comments WHERE id = $1', [id]);
    if (commentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (commentCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'You can only edit your own comments' });
    }

    await query(
      'UPDATE ticket_comments SET comment_text = $1 WHERE id = $2',
      [comment_text, id]
    );

    // Fetch the updated comment with user details
    const commentResult = await query(
      `SELECT
        c.*,
        u.name as user_name,
        d.name as user_department
      FROM ticket_comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE c.id = $1`,
      [id]
    );

    return res.json(commentResult.rows[0]);
  } catch (error) {
    console.error('Update comment error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const isAdmin = req.user?.isAdmin;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if comment exists
    const commentCheck = await query('SELECT user_id FROM ticket_comments WHERE id = $1', [id]);
    if (commentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Allow deletion if user is the owner or admin
    if (commentCheck.rows[0].user_id !== userId && !isAdmin) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }

    await query('DELETE FROM ticket_comments WHERE id = $1', [id]);

    return res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
