import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { AdminUser } from '../types';
import { storeDB } from './db';

function getJwtSecret(): string {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: ADMIN_JWT_SECRET environment variable is required in production. Please set ADMIN_JWT_SECRET in your Render environment settings.');
    }
    return 'ammiexpress_jwt_secret_dev_key_849204';
  }
  return secret;
}

export interface AuthTokenPayload {
  id: string;
  username: string;
  email: string;
  role: string;
  tokenVersion?: number;
  updatedAt?: string;
  iat?: number;
  exp?: number;
}

export function generateToken(user: AdminUser): string {
  const payload: AuthTokenPayload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    tokenVersion: user.tokenVersion || 1,
    updatedAt: user.updatedAt
  };
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
  } catch (e) {
    return null;
  }
}

export interface AuthenticatedRequest extends Request {
  adminUser?: AuthTokenPayload;
}

export function extractAdminToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1].trim();
  }
  if (req.headers['x-admin-token'] && typeof req.headers['x-admin-token'] === 'string') {
    return req.headers['x-admin-token'].trim();
  }
  if (req.headers.cookie) {
    const match = req.headers.cookie.match(/(?:^|;\s*)ammi_admin_token=([^;]+)/);
    if (match) {
      return decodeURIComponent(match[1].trim());
    }
  }
  if (req.query && typeof req.query.admin_token === 'string') {
    return req.query.admin_token.trim();
  }
  return null;
}

export function requireAdminAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractAdminToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }

  // Session Invalidation check against DB
  const admin = storeDB.getAdminUsers().find(u => u.id === payload.id);
  if (!admin) {
    return res.status(401).json({ error: 'Session invalidated: Admin account not found.' });
  }

  const currentVersion = admin.tokenVersion || 1;
  const tokenVersion = payload.tokenVersion || 1;
  if (currentVersion !== tokenVersion) {
    return res.status(401).json({
      error: 'Session invalidated: Admin Key was updated. Please sign in with your new Admin Key.',
      sessionInvalidated: true
    });
  }

  req.adminUser = payload;
  next();
}
