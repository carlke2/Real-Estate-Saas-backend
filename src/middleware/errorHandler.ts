import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export interface ApiError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  error: ApiError | any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  // Zod validation error
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.issues,
    });
  }

  // Custom API error
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  // Default server error
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
};

export const createError = (
  statusCode: number,
  message: string
): ApiError => {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  return error;
};
