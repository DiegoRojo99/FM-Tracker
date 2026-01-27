import { CareerChallenge, CareerStint, CompetitionGroup, Game, Save as PrismaSave, Season, Trophy } from '../../../../prisma/generated/client';
import { CareerStint } from './Career';
import { Team } from './Team';

export type Save = PrismaSave;

export type SaveInput = {
  userId: string;
  gameId: string;
  countryCode: string;
  leagueId: number;
  startingTeamId: number;
}

export type PreviewSave = Save & {
  currentClub: Team | null;
  currentNT: Team | null;
  currentLeague: CompetitionGroup | null;
  game: Game;
}

export type FullSave = Save & {
  currentClub: Team | null;
  currentNT: Team | null;
  currentLeague: CompetitionGroup | null;
  game: Game;
  trophies: Trophy[];
  challenges: CareerChallenge[];
  careerStints: CareerStint[];
  seasons: Season[];
}

export type FullDetailsSave = Save & {
  currentClub: Team | null;
  currentNT: Team | null;
  currentLeague: CompetitionGroup | null;
  game: Game;
  trophies: Trophy[];
  challenges: CareerChallenge[];
  careerStints: FullCareerStint[];
  seasons: Season[];
}