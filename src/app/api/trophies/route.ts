import { withAuth } from '@/lib/auth/withAuth';
import { NextRequest } from 'next/server';
import { getAllTrophiesForUser } from '@/lib/db/trophies';
import { FullTrophy, TrophyGroup } from '@/lib/types/prisma/Trophy';
import { fetchCompetition } from '@/lib/db/competitions';

export async function GET(req: NextRequest) {
  return withAuth(req, async (uid) => {
    if (!uid) return new Response('Unauthorized', { status: 401 });

    const { searchParams } = new URL(req.url);
    const game = searchParams.get('game'); // e.g., "FM24", "FM25"

    const userTrophies: FullTrophy[] = await getAllTrophiesForUser(uid);
    
    // Filter by game if specified
    const filteredTrophies: FullTrophy[] = game 
      ? userTrophies.filter(trophy => trophy.gameId === game)
      : userTrophies;
    
    const groupedTrophies: TrophyGroup[] = [];
    const competitions = await Promise.all(
      filteredTrophies.map(trophy => trophy.competitionGroupId)
        .filter((value, index, self) => self.indexOf(value) === index)
        .map(async (competitionGroupId) => {
          const competitionGroup = await fetchCompetition(competitionGroupId);
          return competitionGroup;
        })
    );

    await Promise.all(
      filteredTrophies.map(async (trophy) => {
          const group = groupedTrophies.find((g) => g.competitionGroup.id === trophy.competitionGroupId);
          if (group) group.trophies.push(trophy);
          else {
            const competitionGroup = competitions.find(comp => comp && comp.id === trophy.competitionGroupId);
            if (competitionGroup){
              groupedTrophies.push({
                competitionGroup: competitionGroup,
                trophies: [trophy],
              });
            }
          }
      })
    );

    return new Response(JSON.stringify(groupedTrophies), { status: 200 });
  });
}
