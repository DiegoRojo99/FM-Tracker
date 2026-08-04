import { NextRequest } from 'next/server';
import { createUserIfNotExists } from '@/lib/db/users';
import { apiError, badRequest, success } from '@/lib/api/response';

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    
    if (!userData.uid || !userData.email) return badRequest('User UID and email are required');
    await createUserIfNotExists(userData);
    
    return success({ created: true });
  } 
  catch (error) {
    console.error('Error creating user:', error);
    return apiError('Failed to create user', 500);
  }
}