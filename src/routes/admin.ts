import { Router } from 'express';
import { authMiddleware, adminOnlyMiddleware } from '../middleware/auth.js';
import {
  getAdminMetrics,
  toggleFeatured,
  getFeaturedProperties,
  getAuditLogs,
  getAllUsers,
  getAllPropertiesAdmin,
  moderateProperty,
  verifyAgent,
  getAgentVerificationRequests,
} from '../controllers/adminController.js';

const router = Router();

// All admin routes require auth + admin role
router.use(authMiddleware, adminOnlyMiddleware);

// Metrics
router.get('/metrics', getAdminMetrics);

// Users
router.get('/users', getAllUsers);

// Agent Verifications — V3 Trust Queue
router.get('/agents/verifications', getAgentVerificationRequests);
router.patch('/agents/:userId/verify', verifyAgent);

// Properties
router.get('/properties', getAllPropertiesAdmin);
router.get('/featured', getFeaturedProperties);
router.patch('/properties/:id/featured', toggleFeatured);
router.patch('/properties/:id/moderate', moderateProperty);

// Audit
router.get('/audit-logs', getAuditLogs);

export default router;