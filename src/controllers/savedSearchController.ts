import type { Response } from 'express';
import type { AuthRequest } from '../types/index.js';
import { prisma } from '../index.js';
import { createError } from '../middleware/errorHandler.js';

/**
 * Create a new saved search (alert)
 */
export const createSavedSearch = async (req: AuthRequest, res: Response) => {
  try {
    const { name, filters } = req.body;

    if (!name || !filters) {
      throw createError(400, 'Name and filters are required');
    }

    const savedSearch = await prisma.savedSearch.create({
      data: {
        name,
        filters,
        userId: req.userId!,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Search saved successfully. You will see alerts for new matches.',
      data: savedSearch,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res
        .status((error as any).statusCode || 500)
        .json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to save search' });
  }
};

/**
 * Get all saved searches for the current user
 */
export const getMySavedSearches = async (req: AuthRequest, res: Response) => {
  try {
    const savedSearches = await prisma.savedSearch.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });

    // For each saved search, let's find the number of "new" properties
    // matching those filters since lastChecked
    const enrichedSearches = await Promise.all(
      savedSearches.map(async (search: any) => {
        const filters = search.filters as any;
        const where: any = {
          createdAt: { gt: search.lastChecked },
          status: 'VERIFIED',
          deletedAt: null,
        };

        if (filters.location) where.location = { contains: filters.location, mode: 'insensitive' };
        if (filters.county) where.county = { contains: filters.county, mode: 'insensitive' };
        if (filters.propertyType) where.propertyType = filters.propertyType;
        if (filters.listingType) where.listingType = filters.listingType;
        if (filters.minPrice || filters.maxPrice) {
          where.price = {};
          if (filters.minPrice) where.price.gte = Number(filters.minPrice);
          if (filters.maxPrice) where.price.lte = Number(filters.maxPrice);
        }

        const newMatchCount = await prisma.property.count({ where });

        return {
          ...search,
          newMatchCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: enrichedSearches,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch saved searches' });
  }
};

/**
 * Delete a saved search
 */
export const deleteSavedSearch = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const search = await prisma.savedSearch.findUnique({
      where: { id },
    });

    if (!search) {
      throw createError(404, 'Saved search not found');
    }

    if (search.userId !== req.userId) {
      throw createError(403, 'Unauthorized');
    }

    await prisma.savedSearch.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Saved search deleted successfully',
    });
  } catch (error) {
    if (error instanceof Error) {
      return res
        .status((error as any).statusCode || 500)
        .json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to delete saved search' });
  }
};

/**
 * Mark a saved search as "checked" (resets alerts)
 */
export const markAsChecked = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const search = await prisma.savedSearch.findUnique({
      where: { id },
    });

    if (!search || search.userId !== req.userId) {
      throw createError(404, 'Saved search not found');
    }

    await prisma.savedSearch.update({
      where: { id },
      data: { lastChecked: new Date() },
    });

    return res.status(200).json({
      success: true,
      message: 'Alerts cleared',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update alert status' });
  }
};
