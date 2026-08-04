import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { getAllTeamsInSaves } from '@/lib/db/saves';
import { ok } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  return withAuth(req, async () => {
    const uniqueTeams = await getAllTeamsInSaves();
    return ok(uniqueTeams);
  }, { requireAdmin: true });
}