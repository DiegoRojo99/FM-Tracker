import { CompetitionGroup } from '@prisma/client';
import { Trophy as PrismaTrophy } from '../../../../prisma/generated/client';
import { Team } from './Team';

type TrophyGroup = {
  competitionGroup: CompetitionGroup;
  trophies: FullTrophy[];
};

type Trophy = PrismaTrophy;
type FullTrophy = Trophy & {
  team: Team;
  competitionGroup: CompetitionGroup;
};

type TrophyInput = {
  teamId: number;
  competitionId: number;
  dateWon: string;
  game: string;             // "FM24", "FM25", etc.
};

export type { Trophy, TrophyInput, TrophyGroup, FullTrophy };