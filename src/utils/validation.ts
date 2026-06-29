import { z } from 'zod';

// Auth validation
export const RegisterSchema = z.object({
  fullName: z.string().min(2, 'Full name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(10, 'Valid phone number required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const LoginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
});

export const VerifyEmailSchema = z.object({
  email: z.string().email(),
  token: z.string().length(6, 'Token must be exactly 6 digits'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Valid email required'),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email(),
  token: z.string().length(6, 'Token must be exactly 6 digits'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

// User validation
export const UpdateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  bio: z.string().max(500).optional(),
  profileImage: z.string().url().optional(),
});

// Property validation
export const PropertySchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  price: z.number().positive('Price must be positive'),
  location: z.string().min(3, 'Location required'),
  county: z.string().min(2, 'County required'),
  address: z.string().min(5, 'Address required'),
  bedrooms: z.number().int().positive('Bedrooms must be a positive number'),
  bathrooms: z
    .number()
    .int()
    .positive('Bathrooms must be a positive number'),
  furnishing: z.string().optional(),
  propertyType: z.enum([
    'APARTMENT',
    'HOUSE',
    'VILLA',
    'LAND',
    'COMMERCIAL',
  ]),
  area: z.number().positive().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const PropertyImageSchema = z.object({
  imageUrl: z.string().url('Valid image URL required'),
  isPrimary: z.boolean().optional(),
});

// Inquiry validation
export const InquirySchema = z.object({
  name: z.string().min(2, 'Name required'),
  phone: z.string().min(10, 'Phone required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export const InquiryStatusSchema = z.object({
  status: z.enum(['OPEN', 'RESPONDED', 'CLOSED']),
}).refine(data => ['OPEN', 'RESPONDED', 'CLOSED'].includes(data.status), {
  message: 'Invalid status. Use OPEN, RESPONDED, or CLOSED',
  path: ['status'],
});

export const ToggleFeaturedSchema = z.object({
  isFeatured: z.boolean(),
});

export const ModerationSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  rejectionReason: z.string().min(5).optional(),
  moderationNotes: z.string().optional(),
});

export const VerificationRequestSchema = z.object({
  idNumber: z.string().min(5),
  idImage: z.string().url().optional(),
  permitNumber: z.string().optional(),
  permitImage: z.string().url().optional(),
});

// Type exports
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type PropertyInput = z.infer<typeof PropertySchema>;
export type InquiryInput = z.infer<typeof InquirySchema>;
export type InquiryStatusInput = z.infer<typeof InquiryStatusSchema>;
