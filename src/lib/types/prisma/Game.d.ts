import { Game as PrismaGame } from '../../../../prisma/generated/client';
import { Save } from '../Save.d';

export type Game = PrismaGame;
export type GameInput = Omit<PrismaGame, 'id' | 'createdAt' | 'updatedAt'>;

// For components that need game info with saves
export type SaveWithGame = Save & {
  game?: Game;
}