import express from 'express';
import {
  getAllDepartments,
  createDepartment,
  getUsersByDepartment,
} from '../controllers/departmentController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllDepartments);
router.get('/:departmentId/users', getUsersByDepartment);

router.post('/', requireAdmin, createDepartment);

export default router;
