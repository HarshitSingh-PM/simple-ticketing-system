import express from 'express';
import { getAnalytics } from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getAnalytics);

export default router;
