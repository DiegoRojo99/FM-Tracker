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
        description: 'Win the domestic league title',
        logic: 'ALL',
        rules: [
          {
            kind: 'competition.equals',
            subjectType: 'competition',
            operator: 'eq',
            config: { competitionId: 39 },
          },
        ],
      },
      {
        position: 2,
        description: 'Win the domestic cup',
        logic: 'ALL',
        rules: [
          {
            kind: 'competition.equals',
            subjectType: 'competition',
            operator: 'eq',
            config: { competitionId: 45 },
          },
        ],
      },
    ],
  },
  {
    key: 'starter.road-to-europe',
    title: 'Road To Europe',
    description: 'Win one domestic title and one UEFA title in the same save.',
    summary: 'A domestic and continental combo.',
    status: 'PUBLISHED',
    sortOrder: 20,
    tags: ['starter', 'europe', 'progression'],
    goals: [
      {
        position: 1,
        description: 'Win any domestic title in your save country',
        logic: 'ALL',
        rules: [
          {
            kind: 'country.equals',
            subjectType: 'country',
            operator: 'eq',
            config: { countryCode: 'ENG' },
          },
        ],
      },
      {
        position: 2,
        description: 'Win a UEFA Champions League title',
        logic: 'ALL',
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
        description: 'Win a title in England',
        rules: [
          {
            kind: 'country.equals',
            subjectType: 'country',
            operator: 'eq',
            config: { countryCode: 'ENG' },
          },
        ],
      },
      {
        position: 2,
        description: 'Win a title in Spain',
        rules: [
          {
            kind: 'country.equals',
            subjectType: 'country',
            operator: 'eq',
            config: { countryCode: 'ESP' },
          },
        ],
      },
      {
        position: 3,
        description: 'Win a title in Germany',
        rules: [
          {
            kind: 'country.equals',
            subjectType: 'country',
            operator: 'eq',
            config: { countryCode: 'DEU' },
          },
        ],
      },
    ],
  },
  {
    key: 'club.identity.one-club-icons',
    title: 'One-Club Icons',
    description: 'Win major trophies while staying with one identity-defining club group.',
    summary: 'Build a dynasty around a single club identity.',
    status: 'PUBLISHED',
    sortOrder: 40,
    tags: ['club-identity', 'team', 'dynasty'],
    goals: [
      {
        position: 1,
        description: 'Win one domestic trophy with a target club',
        rules: [
          {
            kind: 'team.in',
            subjectType: 'team',
            operator: 'in',
            config: { teamIds: [33, 34, 40] },
          },
        ],
      },
      {
        position: 2,
        description: 'Win one continental trophy with the same club family',
        rules: [
          {
            kind: 'team.in',
            subjectType: 'team',
            operator: 'in',
            config: { teamIds: [33, 34, 40] },
          },
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
