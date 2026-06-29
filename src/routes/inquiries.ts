import { Router } from 'express';
import {
  createInquiry,
  getInquiriesByProperty,
  getMyInquiries,
  getAllInquiries,
  updateInquiryStatus,
} from '../controllers/inquiriesController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/:propertyId', createInquiry);
router.get('/my', authMiddleware, getMyInquiries);
router.get('/property/:propertyId', authMiddleware, getInquiriesByProperty);
router.get('/all', authMiddleware, getAllInquiries);
router.patch('/:id/status', authMiddleware, updateInquiryStatus);

export default router;
