import express from 'express';
import {
  getAllTickets,
  getTicketsByStatus,
  getMyDepartmentTickets,
  getTicketById,
  getTicketHistoryById,
  createTicket,
  updateTicket,
} from '../controllers/ticketController';
import { authenticate } from '../middleware/auth';
import { upload } from '../controllers/commentController';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllTickets);
router.get('/status/:status', getTicketsByStatus);
router.get('/my-department', getMyDepartmentTickets);
router.get('/:id/history', getTicketHistoryById);
router.get('/:id', getTicketById);
router.post('/', upload.single('description_image'), createTicket);
router.put('/:id', updateTicket);

export default router;
