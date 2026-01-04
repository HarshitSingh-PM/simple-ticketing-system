import express from 'express';
import {
  getAllUsers,
  createUser,
  updateUser,
  deactivateUser,
} from '../controllers/userController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/', getAllUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deactivateUser);

export default router;
