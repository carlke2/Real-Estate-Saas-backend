import { Router } from 'express';
import {
  verifyProperty,
  rejectProperty,
  submitVerificationRequest,
  getVerificationStatus,
} from '../controllers/verificationController.js';
import { authMiddleware, adminOnlyMiddleware } from '../middleware/auth.js';

const router = Router();

// Agent Submission
router.post('/request', authMiddleware, submitVerificationRequest);
router.get('/status', authMiddleware, getVerificationStatus);

// Admin moderation for properties
router.patch(
  '/:id/verify',
  authMiddleware,
  adminOnlyMiddleware,
  verifyProperty
);
router.patch(
  '/:id/reject',
  authMiddleware,
  adminOnlyMiddleware,
  rejectProperty
);

export default router;
