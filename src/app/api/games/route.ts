import { NextRequest, NextResponse } from 'next/server';
import { getAllGames, getActiveGames } from '../../../lib/db/games';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    
    const games = activeOnly ? await getActiveGames() : await getAllGames();
    
    return NextResponse.json({ games });
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    );
  }
}