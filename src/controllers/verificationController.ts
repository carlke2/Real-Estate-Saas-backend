import type { Response } from 'express';
import type { AuthRequest } from '../types/index.js';
import { createError } from '../middleware/errorHandler.js';
import { 
  VerificationRequestSchema 
} from '../utils/validation.js';
import { prisma } from '../index.js';
import { logAudit } from '../utils/auditLogger.js';

export const submitVerificationRequest = async (req: AuthRequest, res: Response) => {
  try {
    const body = VerificationRequestSchema.parse(req.body);

    const request = await prisma.userVerification.upsert({
      where: { userId: req.userId! },
      update: {
        ...body,
        status: 'PENDING',
      },
      create: {
        ...body,
        userId: req.userId!,
        status: 'PENDING',
      },
    });

    await logAudit({
      userId: req.userId || null,
      action: 'SUBMIT_VERIFICATION',
      entity: 'User',
      entityId: req.userId as string,
    });

    return res.status(201).json({
      success: true,
      message: 'Verification request submitted successfully',
      data: request,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res
        .status((error as any).statusCode || 400)
        .json({ success: false, message: error.message });
    }
    return res
      .status(500)
      .json({ success: false, message: 'Failed to submit verification' });
  }
};

export const getVerificationStatus = async (req: AuthRequest, res: Response) => {
  try {
    const request = await prisma.userVerification.findUnique({
      where: { userId: req.userId! },
    });

    return res.status(200).json({
      success: true,
      data: request || { status: 'NONE' },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch verification status' });
  }
};

export const verifyProperty = async (req: AuthRequest, res: Response) => {
  try {
    const property = await prisma.property.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });

    if (!property) {
      throw createError(404, 'Property not found');
    }

    const updated = await prisma.property.update({
      where: { id: req.params.id },
      data: { status: 'VERIFIED' },
      include: { images: true },
    });

    await logAudit({
      userId: req.userId || null,
      action: 'VERIFY',
      entity: 'Property',
      entityId: req.params.id as string,
    });

    return res.status(200).json({
      success: true,
      message: 'Property verified successfully',
      data: updated,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res
        .status((error as any).statusCode || 500)
        .json({ success: false, message: error.message });
    }
    return res
      .status(500)
      .json({ success: false, message: 'Failed to verify property' });
  }
};

export const rejectProperty = async (req: AuthRequest, res: Response) => {
  try {
    const property = await prisma.property.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });

    if (!property) {
      throw createError(404, 'Property not found');
    }

    const updated = await prisma.property.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED' },
      include: { images: true },
    });

    await logAudit({
      userId: req.userId || null,
      action: 'REJECT',
      entity: 'Property',
      entityId: req.params.id as string,
    });

    return res.status(200).json({
      success: true,
      message: 'Property rejected',
      data: updated,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res
        .status((error as any).statusCode || 500)
        .json({ success: false, message: error.message });
    }
    return res
      .status(500)
      .json({ success: false, message: 'Failed to reject property' });
  }
};
