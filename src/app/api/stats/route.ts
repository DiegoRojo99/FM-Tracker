import { prisma } from '@/lib/db/prisma';
import { GlobalStats } from '@/lib/types/prisma/Stats';
import { NextResponse } from 'next/server';
import { readThroughCache } from '@/lib/cache/redis';

export async function GET() {
  try {
    const { data: stats, cacheStatus } = await readThroughCache(
      'stats:global',
      60,
      async () => {
        const totalUsers = await prisma.user.count();
        const totalSaves = await prisma.save.count();
        const totalSeasons = await prisma.season.count();
        const totalCareerStints = await prisma.careerStint.count();
        const totalTrophies = await prisma.trophy.count();
        const totalChallenges = await prisma.challenge.count();

        const result: GlobalStats = {
          totalUsers,
          totalSaves,
          totalTrophies,
          totalSeasons,
          totalCareerStints,
          totalChallenges,
          timestamp: new Date().toISOString()
        };

        return result;
      }
    );

    return NextResponse.json(stats, {
      status: 200,
      headers: { 'x-cache': cacheStatus }
    });
  } 
  catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database statistics' },
      { status: 500 }
    );
  }
}
