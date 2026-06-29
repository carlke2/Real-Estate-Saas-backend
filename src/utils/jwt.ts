import jwt, { type SignOptions } from 'jsonwebtoken';
import type { TokenPayload } from '../types/index.js';

const JWT_SECRET = (process.env.JWT_SECRET || 'homesphere-secret') as string;

export const generateToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: '7d',
  };
  return jwt.sign(payload as Record<string, any>, JWT_SECRET, options);
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
};
