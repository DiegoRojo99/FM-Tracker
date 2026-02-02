import { prisma } from '@/lib/db/prisma';
import { GlobalStats } from '@/lib/types/prisma/Stats';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get total number of users
    const totalUsers = await prisma.user.count();

    // Get total number of saves across all users
    const totalSaves = await prisma.save.count();

    // Get total number of seasons across all saves
    const totalSeasons = await prisma.season.count();

    // Get total number of career stints across all saves
    const totalCareerStints = await prisma.careerStint.count();

    // Get total number of trophies
    const totalTrophies = await prisma.trophy.count();

    // Get total number of challenges
    const totalChallenges = await prisma.challenge.count();

    const stats: GlobalStats = {
      totalUsers,
      totalSaves,
      totalTrophies,
      totalSeasons,
      totalCareerStints,
      totalChallenges,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(stats, { status: 200 });
  } 
  catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database statistics' },
      { status: 500 }
    );
  }
}
