import { Router } from 'express';
import {
  createSavedSearch,
  getMySavedSearches,
  deleteSavedSearch,
  markAsChecked,
} from '../controllers/savedSearchController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All saved search routes require authentication
router.use(authMiddleware);

router.post('/', createSavedSearch);
router.get('/my', getMySavedSearches);
router.delete('/:id', deleteSavedSearch);
router.patch('/:id/checked', markAsChecked);

export default router;
