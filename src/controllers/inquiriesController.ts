import type { Response } from 'express';
import type { AuthRequest } from '../types/index.js';
import { InquirySchema, InquiryStatusSchema } from '../utils/validation.js';
import { createError } from '../middleware/errorHandler.js';
import { prisma } from '../index.js';

export const createInquiry = async (req: AuthRequest, res: Response) => {
  try {
    const body = InquirySchema.parse(req.body);
    const { propertyId } = req.params;

    const property = await prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
    });

    if (!property) {
      throw createError(404, 'Property not found');
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        propertyId,
        userId: req.userId || undefined,
        name: body.name,
        phone: body.phone,
        message: body.message,
        status: 'OPEN',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Inquiry created successfully',
      data: inquiry,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res
        .status((error as any).statusCode || 400)
        .json({ success: false, message: error.message });
    }
    return res
      .status(500)
      .json({ success: false, message: 'Failed to create inquiry' });
  }
};

export const getInquiriesByProperty = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { propertyId } = req.params;

    const property = await prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
    });

    if (!property) {
      throw createError(404, 'Property not found');
    }

    if (property.createdById !== req.userId && req.userRole !== 'ADMIN') {
      throw createError(
        403,
        'You can only view inquiries for your own properties'
      );
    }

    const inquiries = await prisma.inquiry.findMany({
      where: { propertyId },
      include: { user: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      message: 'Inquiries fetched successfully',
      data: inquiries,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res
        .status((error as any).statusCode || 500)
        .json({ success: false, message: error.message });
    }
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch inquiries' });
  }
};

export const getMyInquiries = async (req: AuthRequest, res: Response) => {
  try {
    const inquiries = await prisma.inquiry.findMany({
      where: { userId: req.userId },
      include: {
        property: {
          include: { images: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      message: 'Inquiries fetched successfully',
      data: inquiries,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch inquiries' });
  }
};

export const getAllInquiries = async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== 'ADMIN' && req.userRole !== 'AGENT') {
      throw createError(403, 'Access denied');
    }

    const { page = 1, limit = 20, status } = req.query;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) where.status = status;

    // Agents only see inquiries for their own properties
    if (req.userRole === 'AGENT') {
      where.property = { createdById: req.userId };
    }

    const [inquiries, total] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        include: {
          property: { select: { id: true, title: true, location: true } },
          user: { select: { fullName: true, email: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.inquiry.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Inquiries fetched successfully',
      data: { inquiries, total, page: pageNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    if (error instanceof Error) {
      return res
        .status((error as any).statusCode || 500)
        .json({ success: false, message: error.message });
    }
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch inquiries' });
  }
};

export const updateInquiryStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = InquiryStatusSchema.parse(req.body);

    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!inquiry) {
      throw createError(404, 'Inquiry not found');
    }

    // Only property owner or admin can update status
    if (inquiry.property.createdById !== req.userId && req.userRole !== 'ADMIN') {
      throw createError(403, 'Access denied');
    }

    const updated = await prisma.inquiry.update({
      where: { id },
      data: {
        status,
        respondedAt: status === 'RESPONDED' ? new Date() : undefined,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Inquiry status updated',
      data: updated,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res
        .status((error as any).statusCode || 400)
        .json({ success: false, message: error.message });
    }
    return res
      .status(500)
      .json({ success: false, message: 'Failed to update inquiry' });
  }
};
