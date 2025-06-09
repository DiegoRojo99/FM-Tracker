import { adminAuth } from './firebase-admin';
import { NextRequest } from 'next/server';

export async function withAuth(
  req: NextRequest,
  handler: (uid: string) => Promise<Response>
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
    const decoded = await adminAuth.verifyIdToken(token);
    return handler(decoded.uid);
  } 
  catch (err) {
    console.error('Error verifying token:', err);
    return new Response('Unauthorized: Invalid token', { status: 401 });
  }
}
