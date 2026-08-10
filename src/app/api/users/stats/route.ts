import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { UserStats } from '@/lib/types/prisma/Stats';
import { getFullUserSaves } from '@/lib/db/saves';
import { countAllTrophiesForUser } from '@/lib/db/trophies';
import { countUserSeasons } from '@/lib/db/seasons';
import { FullDetailsSave } from '@/lib/types/prisma/Save';
import { getUserMostUsedTeams } from '@/lib/db/career';
import { Team } from '@/lib/types/prisma/Team';
import { getUserAchievementSummary } from '@/lib/db/achievements';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  return withAuth(request, async (uid) => {
    try {
      const userSaves = await getFullUserSaves(uid);
      const [userTrophies, userSeasons, favoriteTeamEntries, achievementSummary, totalPromotions, completedChallenges, inProgressChallenges] = await Promise.all([
        countAllTrophiesForUser(uid),
        countUserSeasons(uid),
        getUserMostUsedTeams(uid) as Promise<Team[]>,
        getUserAchievementSummary(uid),
        prisma.leagueResult.count({ where: { promoted: true, season: { save: { userId: uid } } } }),
        prisma.challengeRun.count({ where: { userId: uid, completedAt: { not: null } } }),
        prisma.challengeRun.count({ where: { userId: uid, completedAt: null } }),
      ]);

      const longestSave = userSaves.reduce((longest: FullDetailsSave | undefined, current) => {
        return (current.seasons.length > (longest?.seasons.length || 0)) ? current : longest;
      }, undefined);

      const userStats: UserStats = {
        activeSaves: userSaves.length,
        totalTrophies: userTrophies,
        totalMatches: 0,
        currentSeasons: userSeasons,
        totalPromotions,
        favoriteTeams: favoriteTeamEntries,
        longestSave,
        achievements: achievementSummary,
        challenges: {
          completedCount: completedChallenges,
          inProgressCount: inProgressChallenges,
        },
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