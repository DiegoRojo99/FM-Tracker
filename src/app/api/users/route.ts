import { NextRequest } from 'next/server';
import { createUserIfNotExists } from '@/lib/db/users';
import { apiError, badRequest, success } from '@/lib/api/response';
import { trackServerEvent } from '@/lib/analytics/server';
import { AnalyticsEvents } from '@/lib/analytics/eventNames';

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    
    if (!userData.uid || !userData.email) return badRequest('User UID and email are required');
    const { created } = await createUserIfNotExists(userData);

    if (created) {
      const visitorId = typeof userData.visitorId === 'string' ? userData.visitorId : null;
      await trackServerEvent(AnalyticsEvents.SignupCompleted, {
        userId: userData.uid,
        visitorId,
      });
    }

    return success({ created });
  } 
  catch (error) {
    console.error('Error creating user:', error);
    return apiError('Failed to create user', 500);
  }
}