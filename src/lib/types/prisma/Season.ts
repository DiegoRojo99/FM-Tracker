import { CompetitionGroup, CupResult, LeagueResult, Season as PrismaSeason } from "@prisma/client";
import { Team } from "./Team";

export type Season = PrismaSeason;

export type SeasonSummary = Season & {
  team: Team;
  leagueResult: FullLeagueResult | null;
  cupResults: FullCupResult[];
};

export type FullLeagueResult = LeagueResult & {
  competition: CompetitionGroup;
}

export type FullCupResult = CupResult & {
  competition: CompetitionGroup;
}

export type CupResultInput = {
  competitionId: string;
  countryCode: string;
  reachedRound: CupRound;
};

export type CupRound =
  | 'Preliminary Round'
  | 'First Qualifying Round'
  | 'Second Qualifying Round'
  | 'Third Qualifying Round'
  | 'Fourth Qualifying Round'
  | 'Playoff Round'
  | 'Group Stage'
  | 'First Round'
  | 'Second Round'
  | 'Third Round'
  | 'Fourth Round'
  | 'Round of 32'
  | 'Round of 16'
  | 'Quarter-Final'
  | 'Semi-Final'
  | 'Final'
  | 'Winners';

export const CUP_ROUNDS: CupRound[] = [
  'Preliminary Round',
  'First Qualifying Round',
  'Second Qualifying Round',
  'Third Qualifying Round',
  'Fourth Qualifying Round',
  'Playoff Round',
  'Group Stage',
  'First Round',
  'Second Round',
  'Third Round',
  'Fourth Round',
  'Round of 32',
  'Round of 16',
  'Quarter-Final',
  'Semi-Final',
  'Final',
  'Winners'
];
export type SeasonInput = {
  season: string;              // "2026/27"
  teamId: string;

  leagueId?: string;
  leaguePosition?: number;
  promoted?: boolean;
  relegated?: boolean;

  cupResults?: CupResultInput[];
  isCurrent?: boolean;
};