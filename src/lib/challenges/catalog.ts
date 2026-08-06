import { ChallengeGoalLogic, ChallengeStatus } from '../../../prisma/generated/client';

export type ChallengeRuleCatalogEntry = {
  kind: string;
  subjectType?: string;
  operator: string;
  config: Record<string, unknown>;
  weight?: number;
};

export type ChallengeGoalCatalogEntry = {
  position: number;
  title?: string;
  description: string;
  logic?: ChallengeGoalLogic;
  metadata?: Record<string, unknown>;
  rules: ChallengeRuleCatalogEntry[];
};

export type ChallengeCatalogEntry = {
  key: string;
  title: string;
  description: string;
  summary?: string;
  status?: ChallengeStatus;
  sortOrder: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
  goals: ChallengeGoalCatalogEntry[];
};

export const CHALLENGE_CATALOG: ChallengeCatalogEntry[] = [
  {
    key: 'starter.domestic-double',
    title: 'Domestic Double Dash',
    description: 'Win both your domestic top division and domestic cup with the same club in one save.',
    summary: 'League plus cup in the same country.',
    status: 'PUBLISHED',
    sortOrder: 10,
    tags: ['starter', 'domestic', 'trophy'],
    goals: [
      {
        position: 1,
        description: 'Win a domestic league title in any country',
        logic: 'ALL',
        rules: [
          {
            kind: 'domestic.league.any-country',
            subjectType: 'competition',
            operator: 'achieved',
            config: { minimum: 1 },
          },
        ],
      },
      {
        position: 2,
        description: 'Win a domestic cup in the same country as one of your league titles',
        logic: 'ALL',
        rules: [
          {
            kind: 'domestic.double.same-country',
            subjectType: 'competition',
            operator: 'achieved',
            config: { minimum: 1 },
          },
        ],
      },
    ],
  },
  {
    key: 'journeyman.cross-border',
    title: 'Cross-Border Collector',
    description: 'Win titles in three different countries with your managed clubs.',
    summary: 'Show continental versatility.',
    status: 'PUBLISHED',
    sortOrder: 30,
    tags: ['journeyman', 'countries', 'long-run'],
    goals: [
      {
        position: 1,
        description: 'Win titles in at least 1 country',
        rules: [
          {
            kind: 'country.distinct-titles-min',
            subjectType: 'country',
            operator: 'gte',
            config: { minCountries: 1 },
          },
        ],
      },
      {
        position: 2,
        description: 'Win titles in at least 2 different countries',
        rules: [
          {
            kind: 'country.distinct-titles-min',
            subjectType: 'country',
            operator: 'gte',
            config: { minCountries: 2 },
          },
        ],
      },
      {
        position: 3,
        description: 'Win titles in at least 3 different countries',
        rules: [
          {
            kind: 'country.distinct-titles-min',
            subjectType: 'country',
            operator: 'gte',
            config: { minCountries: 3 },
          },
        ],
      },
    ],
  },
  {
    key: 'veteran.european-ladder',
    title: 'European Ladder',
    description: 'Complete Europe by lifting Conference League, Europa League, and Champions League titles.',
    summary: 'Climb every UEFA tier.',
    status: 'PUBLISHED',
    sortOrder: 50,
    tags: ['veteran', 'europe', 'uefa'],
    goals: [
      {
        position: 1,
        description: 'Win UEFA Conference League',
        rules: [
          {
            kind: 'competition.equals',
            subjectType: 'competition',
            operator: 'eq',
            config: { competitionId: 848 },
          },
        ],
      },
      {
        position: 2,
        description: 'Win UEFA Europa League',
        rules: [
          {
            kind: 'competition.equals',
            subjectType: 'competition',
            operator: 'eq',
            config: { competitionId: 3 },
          },
        ],
      },
      {
        position: 3,
        description: 'Win UEFA Champions League',
        rules: [
          {
            kind: 'competition.equals',
            subjectType: 'competition',
            operator: 'eq',
            config: { competitionId: 2 },
          },
        ],
      },
    ],
  },
];

export const CHALLENGE_CATALOG_BY_KEY = new Map(CHALLENGE_CATALOG.map((entry) => [entry.key, entry]));
