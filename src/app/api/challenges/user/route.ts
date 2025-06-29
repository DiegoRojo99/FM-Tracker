import { withAuth } from '@/lib/auth/withAuth';
import { NextRequest } from 'next/server';
import { getUserChallenges } from '@/lib/db/challenges';

export async function GET(req: NextRequest) {
  return withAuth(req, async (uid) => {
    if (!uid) return new Response('Unauthorized', { status: 401 });
    const userChallenges = await getUserChallenges(uid);
    return new Response(JSON.stringify(userChallenges), { status: 200 });
  });
}