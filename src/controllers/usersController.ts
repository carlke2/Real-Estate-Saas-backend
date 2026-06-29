import type { Response } from 'express';
import type { AuthRequest } from '../types/index.js';
import { UpdateProfileSchema } from '../utils/validation.js';
import { createError } from '../middleware/errorHandler.js';
import { prisma } from '../index.js';

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw createError(404, 'User not found');
    }

    return res.status(200).json({
      success: true,
      message: 'Profile fetched successfully',
      data: user,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res
        .status((error as any).statusCode || 500)
        .json({ success: false, message: error.message });
    }
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch profile' });
  }
};

export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const body = UpdateProfileSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: body,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isVerified: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res
        .status((error as any).statusCode || 500)
        .json({ success: false, message: error.message });
    }
    return res
      .status(500)
      .json({ success: false, message: 'Failed to update profile' });
  }
};
