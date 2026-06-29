import { Router } from 'express';
import {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  addPropertyImage,
  deletePropertyImage,
  getMyProperties,
} from '../controllers/propertiesController.js';
import { authMiddleware, agentOrAdminMiddleware } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/', getProperties);
router.get('/:id', getPropertyById);

// Protected routes
router.get('/my/listings', authMiddleware, agentOrAdminMiddleware, getMyProperties);
router.post('/', authMiddleware, agentOrAdminMiddleware, createProperty);
router.patch('/:id', authMiddleware, agentOrAdminMiddleware, updateProperty);
router.delete('/:id', authMiddleware, agentOrAdminMiddleware, deleteProperty);

// Images
router.post(
  '/:id/images',
  authMiddleware,
  agentOrAdminMiddleware,
  addPropertyImage
);
router.delete(
  '/images/:imageId',
  authMiddleware,
  agentOrAdminMiddleware,
  deletePropertyImage
);

export default router;
