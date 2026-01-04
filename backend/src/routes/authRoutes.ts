import express from 'express';
import { login, changePassword, getCurrentUser } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/login', login);
router.post('/change-password', authenticate, changePassword);
router.get('/me', authenticate, getCurrentUser);

export default router;
