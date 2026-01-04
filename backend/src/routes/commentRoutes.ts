import express from 'express';
import { getCommentsByTicketId, createComment, updateComment, deleteComment, upload } from '../controllers/commentController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/ticket/:ticketId', getCommentsByTicketId);
router.post('/', upload.single('image'), createComment);
router.put('/:id', updateComment);
router.delete('/:id', deleteComment);

export default router;
