import { CompetitionGroup, Game, Save as PrismaSave } from '../../../../prisma/generated/client';
import { CareerChallengeWithDetails } from './Challenge';
import { SeasonSummary } from './Season';
import { Team } from './Team';
import { FullTrophy } from './Trophy';

export type Save = PrismaSave;

export type SaveInput = {
  countryCode: string | null;
  leagueId: number | null;
  startingTeamId: number | null;
  gameId: string;
}

export type PreviewSave = Save & {
  currentClub: Team | null;
  currentNT: Team | null;
  currentLeague: CompetitionGroup | null;
  game: Game;
}

export type FullDetailsSave = Save & {
  currentClub: Team | null;
  currentNT: Team | null;
  currentLeague: CompetitionGroup | null;
  game: Game;
  trophies: FullTrophy[];
  challenges: CareerChallengeWithDetails[];
  careerStints: FullCareerStint[];
  seasons: SeasonSummary[];
}