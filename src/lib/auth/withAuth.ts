import { adminAuth } from './firebase-admin';
import { NextRequest } from 'next/server';

export type AuthTokenPayload = {
  uid: string;
  admin?: boolean;
};

export type TokenVerifier = (token: string) => Promise<AuthTokenPayload>;

export async function withAuth(
  req: NextRequest,
  handler: (uid: string) => Promise<Response>,
  options?: { requireAdmin?: boolean; verifyToken?: TokenVerifier }
): Promise<Response> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return new Response('Unauthorized: Missing authorization header', { status: 401 });
  }

  const token = authHeader?.split('Bearer ')[1];
  if (!token) {
    return new Response('Unauthorized: Missing token', { status: 401 });
  }

  try {
    const verifier = options?.verifyToken ?? defaultVerifyToken;
    const decoded = await verifier(token);

    if (options?.requireAdmin && decoded.admin !== true) {
      return new Response('Forbidden: Admin access required', { status: 403 });
    }

    return handler(decoded.uid);
  }
  catch (err) {
    console.error('Error verifying token:', err);
    return new Response('Unauthorized: Invalid token', { status: 401 });
  }
}

export async function withOptionalAuth(
  req: NextRequest,
  handler: (uid: string | null) => Promise<Response>,
  options?: { verifyToken?: TokenVerifier }
): Promise<Response> {
  const authHeader = req.headers.get('authorization');

  if (!authHeader) {
    return handler(null);
  }

  const token = authHeader?.split('Bearer ')[1];
  if (!token) {
    return handler(null);
  }

  try {
    const verifier = options?.verifyToken ?? defaultVerifyToken;
    const decoded = await verifier(token);
    return handler(decoded.uid);
  }
  catch (err) {
    console.error('Error verifying token:', err);
    return handler(null);
  }
}

async function defaultVerifyToken(token: string): Promise<AuthTokenPayload> {
  const decoded = await adminAuth.verifyIdToken(token);
  return {
    uid: decoded.uid,
    admin: decoded.admin === true,
  };
}
