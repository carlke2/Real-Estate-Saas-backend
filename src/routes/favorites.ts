import { Router } from 'express';
import { toggleFavorite, getFavoriteIds } from '../controllers/favoritesController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Retrieve all favorited property IDs (for local state sync)
router.get('/ids', authMiddleware, getFavoriteIds);

// Toggle a property favorite (Add/Remove)
router.post('/:propertyId/toggle', authMiddleware, toggleFavorite);

export default router;
