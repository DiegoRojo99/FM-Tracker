import { withAuth } from '@/lib/auth/withAuth';
import {
  getAchievementDefinitions,
  getUserAchievementSummary,
  getUserAchievements,
  seedAchievementDefinitions,
} from '@/lib/db/achievements';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return withAuth(req, async (uid) => {
    try {
      const url = new URL(req.url);
      const gameId = url.searchParams.get('gameId') ?? undefined;

      await seedAchievementDefinitions();

      const [definitions, userAchievements, summary] = await Promise.all([
        getAchievementDefinitions(),
        getUserAchievements(uid, gameId),
        getUserAchievementSummary(uid),
      ]);

      return NextResponse.json({
        definitions,
        userAchievements,
        summary,
      });
    } catch (error) {
      console.error('Error fetching achievements:', error);
      return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
    }
  });
}
