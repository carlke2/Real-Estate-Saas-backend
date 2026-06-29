import { Router } from 'express';
import {
  getUserProfile,
  updateUserProfile,
} from '../controllers/usersController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/me', authMiddleware, getUserProfile);
router.patch('/me', authMiddleware, updateUserProfile);

export default router;
