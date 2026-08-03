import { AchievementCategory, AchievementRarity } from '../../../prisma/generated/client';

export type AchievementEventType =
  | 'season.created'
  | 'trophy.added'
  | 'challenge.progress.updated';

export type AchievementCatalogEntry = {
  key: string;
  title: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  points: number;
  maxProgress: number;
  icon?: string;
  triggerEvents: AchievementEventType[];
};

export const ACHIEVEMENT_CATALOG: AchievementCatalogEntry[] = [
  {
    key: 'trophies.common',
    title: 'First Silverware',
    description: 'Win your first trophy',
    category: 'TROPHIES',
    rarity: 'COMMON',
    points: 10,
    maxProgress: 1,
    triggerEvents: ['trophy.added', 'season.created'],
  },
  {
    key: 'trophies.rare',
    title: 'Trophy Collector',
    description: 'Win 25 trophies',
    category: 'TROPHIES',
    rarity: 'RARE',
    points: 40,
    maxProgress: 25,
    triggerEvents: ['trophy.added', 'season.created'],
  },
  {
    key: 'trophies.epic',
    title: 'Hall of Fame Cabinet',
    description: 'Win 75 trophies',
    category: 'TROPHIES',
    rarity: 'EPIC',
    points: 120,
    maxProgress: 75,
    triggerEvents: ['trophy.added', 'season.created'],
  },
  {
    key: 'trophies.legendary',
    title: 'Cabinet of Legends',
    description: 'Win 250 trophies',
    category: 'TROPHIES',
    rarity: 'LEGENDARY',
    points: 260,
    maxProgress: 250,
    triggerEvents: ['trophy.added', 'season.created'],
  },
  {
    key: 'promotions.common',
    title: 'On The Up',
    description: 'Achieve your first promotion',
    category: 'PROMOTIONS',
    rarity: 'COMMON',
    points: 15,
    maxProgress: 1,
    triggerEvents: ['season.created'],
  },
  {
    key: 'promotions.rare',
    title: 'Promotion Specialist',
    description: 'Achieve 10 promotions',
    category: 'PROMOTIONS',
    rarity: 'RARE',
    points: 60,
    maxProgress: 10,
    triggerEvents: ['season.created'],
  },
  {
    key: 'promotions.epic',
    title: 'Lift-Off Legacy',
    description: 'Achieve 25 promotions',
    category: 'PROMOTIONS',
    rarity: 'EPIC',
    points: 140,
    maxProgress: 25,
    triggerEvents: ['season.created'],
  },
  {
    key: 'promotions.legendary',
    title: 'Promotion Myth',
    description: 'Achieve 100 promotions',
    category: 'PROMOTIONS',
    rarity: 'LEGENDARY',
    points: 320,
    maxProgress: 100,
    triggerEvents: ['season.created'],
  },
  {
    key: 'challenges.common',
    title: 'Challenger',
    description: 'Complete your first challenge',
    category: 'CHALLENGES',
    rarity: 'COMMON',
    points: 20,
    maxProgress: 1,
    triggerEvents: ['challenge.progress.updated', 'trophy.added', 'season.created'],
  },
  {
    key: 'challenges.rare',
    title: 'Seasoned Challenger',
    description: 'Complete 10 challenges',
    category: 'CHALLENGES',
    rarity: 'RARE',
    points: 55,
    maxProgress: 10,
    triggerEvents: ['challenge.progress.updated', 'trophy.added', 'season.created'],
  },
  {
    key: 'challenges.epic',
    title: 'Elite Challenger',
    description: 'Complete 30 challenges',
    category: 'CHALLENGES',
    rarity: 'EPIC',
    points: 90,
    maxProgress: 30,
    triggerEvents: ['challenge.progress.updated', 'trophy.added', 'season.created'],
  },
  {
    key: 'challenges.legendary',
    title: 'Challenge Icon',
    description: 'Complete 100 challenges',
    category: 'CHALLENGES',
    rarity: 'LEGENDARY',
    points: 220,
    maxProgress: 100,
    triggerEvents: ['challenge.progress.updated', 'trophy.added', 'season.created'],
  },
  {
    key: 'career.common',
    title: 'Journeyman Start',
    description: 'Manage 5 distinct clubs in career stints',
    category: 'CAREER',
    rarity: 'COMMON',
    points: 20,
    maxProgress: 5,
    triggerEvents: ['season.created', 'trophy.added'],
  },
  {
    key: 'career.rare',
    title: 'Wandering Boss',
    description: 'Manage 25 distinct clubs in career stints',
    category: 'CAREER',
    rarity: 'RARE',
    points: 70,
    maxProgress: 25,
    triggerEvents: ['season.created', 'challenge.progress.updated'],
  },
  {
    key: 'career.epic',
    title: 'Globe-Trotter Manager',
    description: 'Manage 100 distinct clubs',
    category: 'CAREER',
    rarity: 'EPIC',
    points: 150,
    maxProgress: 100,
    triggerEvents: ['season.created', 'challenge.progress.updated'],
  },
  {
    key: 'career.legendary',
    title: 'Nomad Legend',
    description: 'Manage 250 distinct clubs',
    category: 'CAREER',
    rarity: 'LEGENDARY',
    points: 360,
    maxProgress: 250,
    triggerEvents: ['season.created', 'challenge.progress.updated'],
  },
  {
    key: 'seasons.common',
    title: 'Decade Dugout',
    description: 'Complete 10 seasons',
    category: 'SEASONS_CONSISTENCY',
    rarity: 'COMMON',
    points: 20,
    maxProgress: 10,
    triggerEvents: ['season.created'],
  },
  {
    key: 'seasons.rare',
    title: 'Half-Century Dugout',
    description: 'Complete 50 seasons',
    category: 'SEASONS_CONSISTENCY',
    rarity: 'RARE',
    points: 90,
    maxProgress: 50,
    triggerEvents: ['season.created'],
  },
  {
    key: 'seasons.epic',
    title: 'Dynasty Builder',
    description: 'Complete 250 seasons',
    category: 'SEASONS_CONSISTENCY',
    rarity: 'EPIC',
    points: 220,
    maxProgress: 250,
    triggerEvents: ['season.created'],
  },
  {
    key: 'seasons.legendary',
    title: 'Immortal Career',
    description: 'Complete 1000 seasons',
    category: 'SEASONS_CONSISTENCY',
    rarity: 'LEGENDARY',
    points: 500,
    maxProgress: 1000,
    triggerEvents: ['season.created'],
  },
];

export const ACHIEVEMENT_CATALOG_BY_KEY = new Map(
  ACHIEVEMENT_CATALOG.map((entry) => [entry.key, entry])
);
