import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { UserStats } from '@/lib/types/prisma/Stats';
import { getFullUserSaves } from '@/lib/db/prisma/saves';
import { countAllTrophiesForUser } from '@/lib/db/prisma/trophies';
import { countUserSeasons } from '@/lib/db/prisma/seasons';
import { FullDetailsSave } from '@/lib/types/prisma/Save';
import { getUserMostUsedTeam } from '@/lib/db/prisma/career';
import { Team } from '@/lib/types/prisma/Team';

export async function GET(request: NextRequest) {
  return withAuth(request, async (uid) => {
    try {
      // Get user saves
      const userSaves = await getFullUserSaves(uid);
      const userTrophies = await countAllTrophiesForUser(uid);
      const userSeasons = await countUserSeasons(uid);
      const favoriteTeamEntry: Team | null = await getUserMostUsedTeam(uid);

      const longestSave = userSaves.reduce((longest: FullDetailsSave | undefined, current) => {
        return (current.seasons.length > (longest?.seasons.length || 0)) ? current : longest;
      }, undefined);

      // Create empty stats
      const userStats: UserStats = {
        activeSaves: userSaves.length,
        totalTrophies: userTrophies,
        totalMatches: 0,
        currentSeasons: userSeasons,
        favoriteTeam: favoriteTeamEntry ?? undefined,
        longestSave: longestSave
      };
      
      return new Response(JSON.stringify(userStats), { status: 200 });

    } 
    catch (error) {
      console.error('Error fetching user stats:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }), 
        { status: 500 }
      );
    }
  });
}