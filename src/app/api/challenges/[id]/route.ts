import { NextRequest } from 'next/server';
import { getChallengeById, getUserChallengesByChallenge } from '@/lib/db/challenges';
import { withOptionalAuth } from '@/lib/auth/withAuth';
import { CareerChallengeWithSaveDetails } from '@/lib/types/prisma/Challenge';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withOptionalAuth(req, async (uid) => {
    const { id } = await params;
    const challengeId = Number(id);

    try {
      // Fetch the challenge data
      const challenge = await getChallengeById(challengeId);
      if (!challenge) return new Response(JSON.stringify({ error: 'Challenge not found' }), { status: 404 });

      // Try to get user challenges if authenticated
      let userChallenges: CareerChallengeWithSaveDetails[] = [];
      if (uid) userChallenges = await getUserChallengesByChallenge(challengeId, uid);

      // Return challenge with optional user challenges data
      return new Response(JSON.stringify({ challenge, userChallenges }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } 
    catch (error) {
      console.error('Error fetching challenge:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
  });
}
