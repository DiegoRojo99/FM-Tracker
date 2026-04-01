import { NextRequest } from 'next/server';
import { withOptionalAuth } from '@/lib/auth/withAuth';
import { UserStats } from '@/lib/types/prisma/Stats';
import { getFullUserSaves } from '@/lib/db/saves';
import { countAllTrophiesForUser } from '@/lib/db/trophies';
import { countUserSeasons } from '@/lib/db/seasons';
import { FullDetailsSave } from '@/lib/types/prisma/Save';
import { getUserMostUsedTeams } from '@/lib/db/career';
import { getUserById } from '@/lib/db/users';
import { Team } from '@/lib/types/prisma/Team';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withOptionalAuth(request, async () => {
    try {
      const { id: targetUserId } = await params;
      // Get the user first to ensure they exist
      const user = await getUserById(targetUserId);
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'User not found' }), 
          { status: 404 }
        );
      }

      // Get user saves and stats
      const userSaves = await getFullUserSaves(targetUserId);
      const userTrophies = await countAllTrophiesForUser(targetUserId);
      const userSeasons = await countUserSeasons(targetUserId);
      const favoriteTeamEntries: Team[] = await getUserMostUsedTeams(targetUserId);

      const longestSave = userSaves.reduce((longest: FullDetailsSave | undefined, current) => {
        return (current.seasons.length > (longest?.seasons.length || 0)) ? current : longest;
      }, undefined);

      // Create stats with user info
      const userStats: UserStats & { user: typeof user } = {
        user, // Include user information
        activeSaves: userSaves.length,
        totalTrophies: userTrophies,
        totalMatches: 0,
        currentSeasons: userSeasons,
        favoriteTeams: favoriteTeamEntries,
        longestSave: longestSave
      };
      
      return new Response(JSON.stringify(userStats), { status: 200 });
    } 
    catch (error) {
      console.error('Error fetching user profile:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }), 
        { status: 500 }
      );
    }
  });
}