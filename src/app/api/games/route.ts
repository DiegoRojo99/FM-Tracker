import { NextRequest, NextResponse } from 'next/server';
import { getAllGames, getActiveGames, createGame } from '../../../lib/db/games';
import { FirebaseGameInput } from '../../../lib/types/firebase/Game.d';

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

export async function POST(request: NextRequest) {
  try {
    const gameData: FirebaseGameInput = await request.json();
    
    // Basic validation
    if (!gameData.name || !gameData.version || !gameData.platform) {
      return NextResponse.json(
        { error: 'Missing required fields: name, version, platform' },
        { status: 400 }
      );
    }
    
    const gameId = await createGame(gameData);
    
    return NextResponse.json({ 
      success: true, 
      gameId,
      message: 'Game created successfully' 
    });
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json(
      { error: 'Failed to create game' },
      { status: 500 }
    );
  }
}