import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Request, Response, NextFunction } from 'express';
import { db } from '../database/db.ts';

export const SESSION_COOKIE_NAME = 'shyam_admin_session';

function resolveSessionSecret(): string {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16) {
    return process.env.SESSION_SECRET;
  }
  const secretFile = path.resolve(process.cwd(), 'database', '.session_secret');
  if (fs.existsSync(secretFile)) {
    return fs.readFileSync(secretFile, 'utf8').trim();
  }
  const generated = crypto.randomBytes(32).toString('hex');
  try {
    fs.writeFileSync(secretFile, generated, { mode: 0o600 });
  } catch {
    // Ignore write failure in read-only serverless environments
  }
  return generated;
}

const SESSION_SECRET = resolveSessionSecret();

export interface AdminUserPayload {
  id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'editor';
  avatar_url: string;
  email_verified: boolean;
}

export interface AuthenticatedRequest extends Request {
  admin?: AdminUserPayload;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

interface TokenClaims {
  sub: string;
  role: 'super_admin' | 'editor';
  exp: number;
}

export function signSessionToken(userId: string, role: 'super_admin' | 'editor'): string {
  const claims: TokenClaims = {
    sub: userId,
    role,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  const payloadB64 = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');
  return `${payloadB64}.${signature}`;
}

export function verifySessionToken(token: string): TokenClaims | null {
  if (!token || !token.includes('.')) return null;
  const [payloadB64, signature] = token.split('.');
  if (!payloadB64 || !signature) return null;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadB64)
    .digest('base64url');
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const claims = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as TokenClaims;
    if (!claims.sub || !claims.exp || claims.exp < Date.now()) {
      return null;
    }
    return claims;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, token: string): void {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
}

export function getAdminFromRequest(req: Request): AdminUserPayload | null {
  const token = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
  if (!token) return null;
  const claims = verifySessionToken(token);
  if (!claims) return null;

  const row = db
    .prepare(
      `SELECT id, email, full_name, role, avatar_url, is_active, email_verified
       FROM profiles WHERE id = ?`
    )
    .get(claims.sub) as
    | {
        id: string;
        email: string;
        full_name: string;
        role: 'super_admin' | 'editor';
        avatar_url: string;
        is_active: number;
        email_verified: number;
      }
    | undefined;

  if (!row || row.is_active !== 1) return null;
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    role: row.role,
    avatar_url: row.avatar_url || '',
    email_verified: row.email_verified === 1,
  };
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  const admin = getAdminFromRequest(req);
  if (!admin) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  req.admin = admin;
  next();
}

export function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  const admin = getAdminFromRequest(req);
  if (!admin) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  if (admin.role !== 'super_admin') {
    res.status(403).json({ error: 'Super Admin permissions are required for this operation.' });
    return;
  }
  req.admin = admin;
  next();
}
