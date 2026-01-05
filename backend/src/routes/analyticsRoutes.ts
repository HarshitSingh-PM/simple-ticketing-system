import express from 'express';
import { getAnalytics, getEmailStats } from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getAnalytics);
router.get('/email-stats', getEmailStats);

export default router;
