import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { getAllTeamsInSaves } from '@/lib/db/saves';

export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    const uniqueTeams = await getAllTeamsInSaves();
    return new Response(JSON.stringify(uniqueTeams), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }, { requireAdmin: true });
}