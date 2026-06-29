import type { Response } from 'express';
import type { AuthRequest } from '../types/index.js';
import { createError } from '../middleware/errorHandler.js';
import { prisma } from '../index.js';

export const toggleFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.params;
    const userId = req.userId!;

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      throw createError(404, 'Property not found');
    }

    // Check if favorite exists
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
    });

    if (existingFavorite) {
      // Remove favorite
      await prisma.favorite.delete({
        where: { id: existingFavorite.id },
      });
      return res.status(200).json({
        success: true,
        message: 'Property removed from favorites',
      });
    } else {
      // Add favorite
      await prisma.favorite.create({
        data: {
          userId,
          propertyId,
        },
      });
      return res.status(201).json({
        success: true,
        message: 'Property added to favorites',
      });
    }
  } catch (error) {
    if (error instanceof Error) {
      return res
        .status((error as any).statusCode || 500)
        .json({ success: false, message: error.message });
    }
    return res
      .status(500)
      .json({ success: false, message: 'Failed to toggle favorite' });
  }
};

export const getFavoriteIds = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      select: { propertyId: true },
    });

    const propertyIds = favorites.map((f: { propertyId: string }) => f.propertyId);

    return res.status(200).json({
      success: true,
      data: propertyIds,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch favorites' });
  }
};
