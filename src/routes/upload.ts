import { Router } from 'express';
import multer from 'multer';
import type { NextFunction, Request, Response } from 'express';
import { uploadImageBuffer } from '../services/cloudinary.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Store file in memory so we can stream to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
    cb(null, true);
  },
});

const handleUploadError = (error: unknown, res: Response): Response => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Image must be 10MB or smaller',
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (error instanceof Error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Upload failed',
  });
};

const singleImageUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.single('image')(req, res, (error) => {
    if (error) {
      return handleUploadError(error, res);
    }

    next();
  });
};

const multipleImageUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.array('images', 10)(req, res, (error) => {
    if (error) {
      return handleUploadError(error, res);
    }

    next();
  });
};

// POST /api/upload/image  — upload a single image
router.post(
  '/image',
  authMiddleware,
  singleImageUpload,
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image file provided' });
      }

      const result = await uploadImageBuffer(req.file.buffer, 'homesphere/properties');

      return res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        },
      });
    } catch (error) {
      console.error('Image upload error:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Image upload failed',
      });
    }
  }
);

// POST /api/upload/images — upload multiple images (max 10)
router.post(
  '/images',
  authMiddleware,
  multipleImageUpload,
  async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ success: false, message: 'No image files provided' });
      }

      const uploadPromises = files.map((file) =>
        uploadImageBuffer(file.buffer, 'homesphere/properties')
      );
      const results = await Promise.all(uploadPromises);

      return res.status(200).json({
        success: true,
        message: `${results.length} image(s) uploaded successfully`,
        data: results.map((r) => ({
          url: r.secure_url,
          publicId: r.public_id,
        })),
      });
    } catch (error) {
      console.error('Bulk upload error:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Upload failed',
      });
    }
  }
);

export default router;
