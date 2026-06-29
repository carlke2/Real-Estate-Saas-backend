import type { Response } from 'express';
import type { AuthRequest } from '../types/index.js';
import { PropertySchema, PropertyImageSchema } from '../utils/validation.js';
import { createError } from '../middleware/errorHandler.js';
import { prisma } from '../index.js';
import { logAudit } from '../utils/auditLogger.js';
import { z } from 'zod';

export const createProperty = async (req: AuthRequest, res: Response) => {
  try {
    const body = PropertySchema.parse(req.body);
    const images = req.body.images ? z.array(PropertyImageSchema).parse(req.body.images) : [];

    const property = await prisma.property.create({
      data: {
        ...body,
        createdById: req.userId!,
        images: images.length > 0 ? { create: images } : undefined,
      },
      include: {
        images: true,
        createdBy: { select: { fullName: true, phone: true } },
      },
    });

    await logAudit({ userId: req.userId || null, action: 'CREATE', entity: 'Property', entityId: property.id });

    return res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: property,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res
        .status((error as any).statusCode || 400)
        .json({ success: false, message: error.message });
    }
    return res
      .status(500)
      .json({ success: false, message: 'Failed to create property' });
  }
};

export const getProperties = async (req: AuthRequest, res: Response) => {
  try {
    const {
      search,
      location,
      county,
      minPrice,
      maxPrice,
      propertyType,
      listingType,
      bedrooms,
      bathrooms,
      furnishing,
      status,
      isFeatured,
      verifiedOnly,
      sortBy = 'newest',
      page = 1,
      limit = 12,
    } = req.query;

    const where: any = {
      deletedAt: null,
      // Public endpoint always defaults to VERIFIED only.
      // Only ADMIN/AGENT with explicit status param can bypass.
      status: status && (req.userRole === 'ADMIN' || req.userRole === 'AGENT')
        ? status
        : 'VERIFIED',
    };

    if (search) {
      const searchString = (search as string).trim().split(/\s+/).join(' & ');
      where.OR = [
        { title: { search: searchString } },
        { description: { search: searchString } },
        { location: { search: searchString } },
      ];
    }

    if (location) where.location = { contains: location, mode: 'insensitive' };
    if (county) where.county = { contains: county, mode: 'insensitive' };
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }
    if (propertyType) where.propertyType = propertyType;
    if (listingType) where.listingType = listingType;
    if (bedrooms) where.bedrooms = Number(bedrooms);
    if (bathrooms) where.bathrooms = Number(bathrooms);
    if (furnishing) where.furnishing = furnishing;
    if (isFeatured === 'true') where.isFeatured = true;

    // Sort logic
    const orderByMap: Record<string, any> = {
      newest: { createdAt: 'desc' },
      oldest: { createdAt: 'asc' },
      price_asc: { price: 'asc' },
      price_desc: { price: 'desc' },
      popular: { viewCount: 'desc' },
    };
    const orderBy = orderByMap[sortBy as string] || orderByMap.newest;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          images: true,
          createdBy: {
            select: {
              fullName: true,
              phone: true,
              isAgentVerified: true,
              bio: true,
              profileImage: true,
            },
          },
        },
        skip,
        take: limitNum,
        orderBy,
      }),
      prisma.property.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Properties fetched successfully',
      data: {
        properties,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch properties' });
  }
};

export const getPropertyById = async (req: AuthRequest, res: Response) => {
  try {
    const property = await prisma.property.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: {
        images: true,
        createdBy: { select: { fullName: true, phone: true, email: true } },
      },
    });

    if (!property) {
      throw createError(404, 'Property not found');
    }

    // Increment view count (non-blocking)
    prisma.property.update({
      where: { id: req.params.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: 'Property fetched successfully',
      data: property,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res
        .status((error as any).statusCode || 500)
        .json({ success: false, message: error.message });
    }
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch property' });
  }
};

export const updateProperty = async (req: AuthRequest, res: Response) => {
  try {
    const property = await prisma.property.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });

    if (!property) {
      throw createError(404, 'Property not found');
    }

    if (property.createdById !== req.userId && req.userRole !== 'ADMIN') {
      throw createError(403, 'You can only update your own properties');
    }

    const body = PropertySchema.partial().parse(req.body);
    let imagesUpdate = {};

    if (req.body.images && Array.isArray(req.body.images)) {
      const images = z.array(PropertyImageSchema).parse(req.body.images);
      imagesUpdate = {
        images: {
          deleteMany: {}, // wipe old images
          create: images, // insert new ones
        }
      };
    }

    const updated = await prisma.property.update({
      where: { id: req.params.id },
      data: {
        ...body,
        ...imagesUpdate
      },
      include: {
        images: true,
        createdBy: { select: { fullName: true, phone: true } },
      },
    });

    await logAudit({ userId: req.userId || null, action: 'UPDATE', entity: 'Property', entityId: updated.id });

    return res.status(200).json({
      success: true,
      message: 'Property updated successfully',
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

export const deleteProperty = async (req: AuthRequest, res: Response) => {
  try {
    const property = await prisma.property.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });

    if (!property) {
      throw createError(404, 'Property not found');
    }

    if (property.createdById !== req.userId && req.userRole !== 'ADMIN') {
      throw createError(403, 'You can only delete your own properties');
    }

    // Soft delete
    await prisma.property.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });

    await logAudit({ userId: req.userId || null, action: 'DELETE', entity: 'Property', entityId: req.params.id as string });

    return res.status(200).json({
      success: true,
      message: 'Property deleted successfully',
    });
  } catch (error) {
    if (error instanceof Error) {
      return res
        .status((error as any).statusCode || 500)
        .json({ success: false, message: error.message });
    }
    return res
      .status(500)
      .json({ success: false, message: 'Failed to delete property' });
  }
};

export const addPropertyImage = async (req: AuthRequest, res: Response) => {
  try {
    const property = await prisma.property.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });

    if (!property) {
      throw createError(404, 'Property not found');
    }

    const body = PropertyImageSchema.parse(req.body);

    // Check if this is the first image — make it primary
    const existingImages = await prisma.propertyImage.count({
      where: { propertyId: req.params.id },
    });

    const image = await prisma.propertyImage.create({
      data: {
        propertyId: req.params.id,
        imageUrl: body.imageUrl,
        isPrimary: existingImages === 0,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Image added successfully',
      data: image,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res
        .status((error as any).statusCode || 400)
        .json({ success: false, message: error.message });
    }
    return res
      .status(500)
      .json({ success: false, message: 'Failed to add image' });
  }
};

export const deletePropertyImage = async (req: AuthRequest, res: Response) => {
  try {
    const image = await prisma.propertyImage.findUnique({
      where: { id: req.params.imageId },
      include: { property: true },
    });

    if (!image) {
      throw createError(404, 'Image not found');
    }

    if (
      image.property.createdById !== req.userId &&
      req.userRole !== 'ADMIN'
    ) {
      throw createError(403, 'You can only delete your own images');
    }

    await prisma.propertyImage.delete({
      where: { id: req.params.imageId },
    });

    // If deleted image was primary, assign primary to first remaining image
    if (image.isPrimary) {
      const firstImage = await prisma.propertyImage.findFirst({
        where: { propertyId: image.propertyId },
      });
      if (firstImage) {
        await prisma.propertyImage.update({
          where: { id: firstImage.id },
          data: { isPrimary: true },
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    if (error instanceof Error) {
      return res
        .status((error as any).statusCode || 500)
        .json({ success: false, message: error.message });
    }
    return res
      .status(500)
      .json({ success: false, message: 'Failed to delete image' });
  }
};

export const getMyProperties = async (req: AuthRequest, res: Response) => {
  try {
    const properties = await prisma.property.findMany({
      where: { createdById: req.userId!, deletedAt: null },
      include: {
        images: true,
        _count: { select: { inquiries: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      message: 'Properties fetched successfully',
      data: properties,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch properties' });
  }
};
