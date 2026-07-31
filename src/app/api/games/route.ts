import { NextRequest, NextResponse } from 'next/server';
import { getAllGames, getActiveGames } from '../../../lib/db/games';
import { readThroughCache } from '@/lib/cache/redis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const cacheKey = activeOnly ? 'games:active' : 'games:all';
    const { data: games, cacheStatus } = await readThroughCache(
      cacheKey,
      60 * 10,
      () => (activeOnly ? getActiveGames() : getAllGames())
    );

    return NextResponse.json(
      { games },
      { headers: { 'x-cache': cacheStatus } }
    );
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    );
  }
}