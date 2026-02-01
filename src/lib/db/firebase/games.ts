import { Game } from "@/lib/types/prisma/Game";
import { prisma } from "../prisma";

export async function getGame(gameId: string): Promise<Game | null> {
  try {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
    });
    
    return game;
  } 
  catch (error) {
    console.error('Error getting game:', error);
    throw error;
  }
}

export async function getAllGames(): Promise<Game[]> {
  try {
    const games = await prisma.game.findMany(
      { orderBy: [ { sortOrder: 'asc' }, { releaseDate: 'desc' } ] }
    );

    return games;
  } catch (error) {
    console.error('Error getting all games:', error);
    throw error;
  }
}

export async function getActiveGames(): Promise<Game[]> {
  try {
    const games = await prisma.game.findMany({
      where: { isActive: true },
      orderBy: [ { sortOrder: 'asc' }, { releaseDate: 'desc' } ]
    });

    return games;
  } catch (error) {
    console.error('Error getting active games:', error);
    throw error;
  }
}

export async function updateGame(gameId: string, gameData: Partial<Game>): Promise<void> {
  try {
    await prisma.game.update({
      where: { id: gameId },
      data: gameData,
    });
  } catch (error) {
    console.error('Error updating game:', error);
    throw error;
  }
}

export async function deleteGame(gameId: string): Promise<void> {
  try {
    await prisma.game.delete({
      where: { id: gameId },
    });
  } catch (error) {
    console.error('Error deleting game:', error);
    throw error;
  }
}