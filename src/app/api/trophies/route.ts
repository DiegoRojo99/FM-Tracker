import { withAuth } from '@/lib/auth/withAuth';
import { NextRequest } from 'next/server';
import { getAllTrophiesForUser } from '@/lib/db/trophies';
import { Trophy, TrophyGroup } from '@/lib/types/prisma/Trophy';

export async function GET(req: NextRequest) {
  return withAuth(req, async (uid) => {
    if (!uid) return new Response('Unauthorized', { status: 401 });

    const { searchParams } = new URL(req.url);
    const game = searchParams.get('game'); // e.g., "FM24", "FM25"

    const userTrophies: Trophy[] = await getAllTrophiesForUser(uid);
    
    // Filter by game if specified
    const filteredTrophies: Trophy[] = game 
      ? userTrophies.filter(trophy => trophy.gameId === game)
      : userTrophies;
    
    const groupedTrophies: TrophyGroup[] = [];
    await Promise.all(
      filteredTrophies.map(async (trophy) => {
          const group = groupedTrophies.find((g) => g.competitionId === trophy.competitionGroupId);
          if (group) group.trophies.push(trophy);
          else {
            groupedTrophies.push({
              competitionId: trophy.competitionGroupId,
              trophies: [trophy],
            });
          }
      })
    );

    return new Response(JSON.stringify(groupedTrophies), { status: 200 });
  });
}
