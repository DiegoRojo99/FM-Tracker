export type LeagueResult = {
  competitionId: string;
  competitionName?: string;
  competitionLogo?: string;
  position?: number;
  promoted?: boolean;
  relegated?: boolean;
};

export type CupResult = {
  competitionId: string;
  competitionName: string;
  competitionLogo: string;
  reachedRound: CupRound;
};

export type CupResultInput = {
  competitionId: string;
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
  'Round of 32',
  'Round of 16',
  'Quarter-Final',
  'Semi-Final',
  'Final',
  'Winners',
];

export type SeasonSummary = {
  season: string;              // "2026/27"
  teamId: string;
  teamName: string;
  teamLogo: string;

  leagueResult?: LeagueResult;

  cupResults?: CupResult[];
  isCurrent?: boolean;
};

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