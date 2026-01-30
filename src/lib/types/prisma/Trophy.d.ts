import { Trophy as PrismaTrophy } from '../../../../prisma/generated/client';

type TrophyGroup = {
  competitionId: number;
  trophies: Trophy[];
};

type Trophy = PrismaTrophy;

type TrophyInput = {
  teamId: number;
  competitionId: number;
  dateWon: string;
  game: string;             // "FM24", "FM25", etc.
};

export type { Trophy, TrophyInput, TrophyGroup };