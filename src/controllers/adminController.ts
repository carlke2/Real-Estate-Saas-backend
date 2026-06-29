import type { Response } from 'express';
import type { AuthRequest } from '../types/index.js';
import { createError } from '../middleware/errorHandler.js';
import { prisma } from '../index.js';
import { logAudit } from '../utils/auditLogger.js';

export const getAdminMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalUsers,
      totalProperties,
      totalInquiries,
      pendingVerifications,
      verifiedProperties,
      featuredProperties,
      openInquiries,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.property.count({ where: { deletedAt: null } }),
      prisma.inquiry.count(),
      prisma.property.count({ where: { status: 'PENDING', deletedAt: null } }),
      prisma.property.count({ where: { status: 'VERIFIED', deletedAt: null } }),
      prisma.property.count({ where: { isFeatured: true, deletedAt: null } }),
      prisma.inquiry.count({ where: { status: 'OPEN' } }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Metrics fetched successfully',
      data: {
        totalUsers,
        totalProperties,
        totalInquiries,
        pendingVerifications,
        verifiedProperties,
        featuredProperties,
        openInquiries,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch metrics' });
  }
};

export const toggleFeatured = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isFeatured } = req.body;

    const property = await prisma.property.findFirst({
      where: { id, deletedAt: null },
    });

    if (!property) {
      throw createError(404, 'Property not found');
    }

    const updated = await prisma.property.update({
      where: { id },
      data: { isFeatured: Boolean(isFeatured) },
      include: { images: true },
    });

    return res.status(200).json({
      success: true,
      message: `Property ${isFeatured ? 'featured' : 'unfeatured'} successfully`,
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
      .json({ success: false, message: 'Failed to update property' });
  }
};

export const getFeaturedProperties = async (req: AuthRequest, res: Response) => {
  try {
    const properties = await prisma.property.findMany({
      where: { isFeatured: true, deletedAt: null },
      include: {
        images: true,
        createdBy: { select: { fullName: true, phone: true } },
        _count: { select: { inquiries: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      message: 'Featured properties fetched successfully',
      data: properties,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch featured properties' });
  }
};

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        include: {
          user: { select: { fullName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.auditLog.count(),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Audit logs fetched successfully',
      data: { logs, total, page: pageNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch audit logs' });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true,
        _count: { select: { properties: true, inquiries: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      message: 'Users fetched successfully',
      data: users,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch users' });
  }
};

export const getAllPropertiesAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, status, isFeatured } = req.query;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const where: any = { deletedAt: null };
    if (status) where.status = status;
    if (isFeatured !== undefined) where.isFeatured = isFeatured === 'true';

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          images: true,
          createdBy: { select: { fullName: true, email: true } },
          _count: { select: { inquiries: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.property.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Properties fetched successfully',
      data: { properties, total, page: pageNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch properties' });
  }
};
export const moderateProperty = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason, moderationNotes } = req.body;

    if (!['VERIFIED', 'REJECTED'].includes(status)) {
      throw createError(400, 'Invalid moderation status');
    }

    const property = await prisma.property.findFirst({
      where: { id, deletedAt: null },
    });

    if (!property) {
      throw createError(404, 'Property not found');
    }

    const updated = await prisma.property.update({
      where: { id },
      data: {
        status,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
        moderationNotes: moderationNotes || null,
      },
    });

    await logAudit({
      userId: req.userId || null,
      action: status === 'APPROVED' ? 'VERIFY_PROPERTY' : 'REJECT_PROPERTY',
      entity: 'Property',
      entityId: property.id,
      metadata: { notes: moderationNotes }
    });

    return res.status(200).json({
      success: true,
      message: `Property ${status.toLowerCase()} successfully`,
      data: updated,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res
        .status((error as any).statusCode || 400)
        .json({ success: false, message: error.message });
    }
    return res.status(500)
      .json({ success: false, message: 'Failed to moderate property' });
  }
};

export const verifyAgent = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { status, notes } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      throw createError(400, 'Invalid verification status');
    }

    const verification = await prisma.userVerification.findUnique({
      where: { userId },
    });

    if (!verification) {
      throw createError(404, 'Verification request not found');
    }

    await prisma.$transaction([
      prisma.userVerification.update({
        where: { userId },
        data: { status, notes },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { isAgentVerified: status === 'APPROVED' },
      }),
    ]);

    await logAudit({
      userId: req.userId || null,
      action: status === 'APPROVED' ? 'VERIFY_AGENT' : 'REJECT_AGENT',
      entity: 'User',
      entityId: String(userId),
      metadata: { notes }
    });

    return res.status(200).json({
      success: true,
      message: `Agent verification ${status.toLowerCase()} successfully`,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res
        .status((error as any).statusCode || 500)
        .json({ success: false, message: error.message });
    }
    return res
      .status(500)
      .json({ success: false, message: 'Failed to verify agent' });
  }
};

export const getAgentVerificationRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { status = 'PENDING' } = req.query;

    const requests = await prisma.userVerification.findMany({
      where: { status: status as any },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            isAgentVerified: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.status(200).json({
      success: true,
      message: 'Verification requests fetched successfully',
      data: requests,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch verification requests' });
  }
};
