import type { Request } from 'express';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: 'USER' | 'AGENT' | 'ADMIN';
}

export interface TokenPayload {
  id: string;
  role: 'USER' | 'AGENT' | 'ADMIN';
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
