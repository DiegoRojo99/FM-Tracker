import { withAuth } from '@/lib/auth/withAuth';
import { NextRequest } from 'next/server';
import { Trophy, TrophyGroup } from '@/lib/types/Trophy';
import { getAllTrophiesForUser } from '@/lib/db/trophies';

export async function GET(req: NextRequest) {
  return withAuth(req, async (uid) => {
    if (!uid) return new Response('Unauthorized', { status: 401 });

    const userTrophies: Trophy[] = await getAllTrophiesForUser(uid);
    const groupedTrophies: TrophyGroup[] = [];
    await Promise.all(
      userTrophies.map(async (trophy) => {
          const group = groupedTrophies.find((g) => g.competitionId === trophy.competitionId);
          if (group) group.trophies.push(trophy);
          else {
            groupedTrophies.push({
              competitionId: trophy.competitionId,
              competitionName: trophy.competitionName,
              competitionLogo: trophy.competitionLogo,
              competitionType: trophy.competitionType,
              trophies: [trophy],
            });
          }
      })
    );

    return new Response(JSON.stringify(groupedTrophies), { status: 200 });
  });
}
