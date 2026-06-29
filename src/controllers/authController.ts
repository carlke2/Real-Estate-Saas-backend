import type { Response } from 'express';
import type { AuthRequest } from '../types/index.js';
import type { RegisterInput, LoginInput } from '../utils/validation.js';
import { RegisterSchema, LoginSchema, VerifyEmailSchema, ForgotPasswordSchema, ResetPasswordSchema } from '../utils/validation.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { generateOTP, getExpiryDate } from '../utils/token.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.js';
import { createError } from '../middleware/errorHandler.js';
import { prisma } from '../index.js';

export const register = async (req: AuthRequest, res: Response) => {
  try {
    const body = RegisterSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      throw createError(400, 'User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(body.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        fullName: body.fullName,
        email: body.email,
        phone: body.phone,
        password: hashedPassword,
      },
    });

    // Generate OTP
    const otp = generateOTP();
    await prisma.verificationToken.create({
      data: {
        email: user.email,
        token: otp,
        type: 'EMAIL_VERIFICATION',
        expiresAt: getExpiryDate(15),
      },
    });

    // Send email
    await sendVerificationEmail(user.email, otp);

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      requiresVerification: true,
      data: {
        email: user.email,
        fullName: user.fullName,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return res
        .status((error as any).statusCode || 500)
        .json({ success: false, message: error.message });
    }
    return res
      .status(500)
      .json({ success: false, message: 'Registration failed' });
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  try {
    const body = LoginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      throw createError(401, 'Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await verifyPassword(body.password, user.password);
    if (!isPasswordValid) {
      throw createError(401, 'Invalid email or password');
    }

    if (!user.isVerified) {
      // Regenerate OTP and resend
      await prisma.verificationToken.deleteMany({
        where: { email: user.email, type: 'EMAIL_VERIFICATION' },
      });
      const otp = generateOTP();
      await prisma.verificationToken.create({
        data: {
          email: user.email,
          token: otp,
          type: 'EMAIL_VERIFICATION',
          expiresAt: getExpiryDate(15),
        },
      });
      await sendVerificationEmail(user.email, otp);

      return res.status(403).json({
        success: false,
        message: 'Please verify your email first. A new code has been sent.',
        requiresVerification: true,
        email: user.email,
      });
    }

    // Generate token
    const token = generateToken({ id: user.id, role: user.role });

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return res
        .status((error as any).statusCode || 500)
        .json({ success: false, message: error.message });
    }
    return res
      .status(500)
      .json({ success: false, message: 'Login failed' });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      throw createError(404, 'User not found');
    }

    return res.status(200).json({
      success: true,
      message: 'User fetched successfully',
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return res
        .status((error as any).statusCode || 500)
        .json({ success: false, message: error.message });
    }
    return res
      .status(500)
      .json({ success: false, message: 'Failed to fetch user' });
  }
};

export const verifyEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { email, token } = VerifyEmailSchema.parse(req.body);

    const verificationRecord = await prisma.verificationToken.findFirst({
      where: {
        email,
        token,
        type: 'EMAIL_VERIFICATION',
      },
    });

    if (!verificationRecord) {
      throw createError(400, 'Invalid or expired verification code');
    }

    if (verificationRecord.expiresAt < new Date()) {
      await prisma.verificationToken.delete({ where: { id: verificationRecord.id } });
      throw createError(400, 'Verification code has expired. Please log in to request a new one.');
    }

    const user = await prisma.user.update({
      where: { email },
      data: { isVerified: true },
    });

    await prisma.verificationToken.deleteMany({
      where: { email, type: 'EMAIL_VERIFICATION' },
    });

    const jwtToken = generateToken({ id: user.id, role: user.role });

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        token: jwtToken,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status((error as any).statusCode || 400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

export const forgotPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { email } = ForgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return success anyway to prevent email enumeration
      return res.status(200).json({ success: true, message: 'If that email is registered, a reset code has been sent.' });
    }

    await prisma.verificationToken.deleteMany({
      where: { email, type: 'PASSWORD_RESET' },
    });

    const otp = generateOTP();
    await prisma.verificationToken.create({
      data: {
        email,
        token: otp,
        type: 'PASSWORD_RESET',
        expiresAt: getExpiryDate(15),
      },
    });

    await sendPasswordResetEmail(email, otp);

    return res.status(200).json({
      success: true,
      message: 'If that email is registered, a reset code has been sent.',
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status((error as any).statusCode || 400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Request failed' });
  }
};

export const resetPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { email, token, newPassword } = ResetPasswordSchema.parse(req.body);

    const resetRecord = await prisma.verificationToken.findFirst({
      where: {
        email,
        token,
        type: 'PASSWORD_RESET',
      },
    });

    if (!resetRecord) {
      throw createError(400, 'Invalid or incorrect reset code');
    }

    if (resetRecord.expiresAt < new Date()) {
      await prisma.verificationToken.delete({ where: { id: resetRecord.id } });
      throw createError(400, 'Reset code has expired. Please request a new one.');
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    await prisma.verificationToken.deleteMany({
      where: { email, type: 'PASSWORD_RESET' },
    });

    return res.status(200).json({
      success: true,
      message: 'Password has been successfully updated. You can now log in.',
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status((error as any).statusCode || 400).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Password reset failed' });
  }
};
