import express from 'express';
import {
  getAllUsers,
  createUser,
  updateUser,
  deactivateUser,
  activateUser,
  changeUserPassword,
  deleteUser,
} from '../controllers/userController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/', getAllUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.post('/:id/change-password', changeUserPassword);
router.post('/:id/deactivate', deactivateUser);
router.post('/:id/activate', activateUser);
router.delete('/:id', deleteUser);

export default router;
