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
    key: 'trophies.first',
    title: 'First Silverware',
    description: 'Win your first trophy',
    category: 'TROPHIES',
    rarity: 'COMMON',
    points: 10,
    maxProgress: 1,
    triggerEvents: ['trophy.added', 'season.created'],
  },
  {
    key: 'trophies.ten',
    title: 'Trophy Collector',
    description: 'Win 10 trophies',
    category: 'TROPHIES',
    rarity: 'RARE',
    points: 40,
    maxProgress: 10,
    triggerEvents: ['trophy.added', 'season.created'],
  },
  {
    key: 'trophies.fifty',
    title: 'Hall of Fame Cabinet',
    description: 'Win 50 trophies',
    category: 'TROPHIES',
    rarity: 'LEGENDARY',
    points: 120,
    maxProgress: 50,
    triggerEvents: ['trophy.added', 'season.created'],
  },
  {
    key: 'promotions.first',
    title: 'On The Up',
    description: 'Achieve your first promotion',
    category: 'PROMOTIONS',
    rarity: 'COMMON',
    points: 15,
    maxProgress: 1,
    triggerEvents: ['season.created'],
  },
  {
    key: 'promotions.five',
    title: 'Promotion Specialist',
    description: 'Achieve 5 promotions',
    category: 'PROMOTIONS',
    rarity: 'RARE',
    points: 60,
    maxProgress: 5,
    triggerEvents: ['season.created'],
  },
  {
    key: 'promotions.ten',
    title: 'Lift-Off Legacy',
    description: 'Achieve 10 promotions',
    category: 'PROMOTIONS',
    rarity: 'EPIC',
    points: 140,
    maxProgress: 10,
    triggerEvents: ['season.created'],
  },
  {
    key: 'challenges.first_complete',
    title: 'Challenger',
    description: 'Complete your first challenge',
    category: 'CHALLENGES',
    rarity: 'COMMON',
    points: 20,
    maxProgress: 1,
    triggerEvents: ['challenge.progress.updated', 'trophy.added', 'season.created'],
  },
  {
    key: 'challenges.five_complete',
    title: 'Elite Challenger',
    description: 'Complete 5 challenges',
    category: 'CHALLENGES',
    rarity: 'EPIC',
    points: 90,
    maxProgress: 5,
    triggerEvents: ['challenge.progress.updated', 'trophy.added', 'season.created'],
  },
  {
    key: 'career.first_save',
    title: 'Journey Begins',
    description: 'Create your first save',
    category: 'CAREER',
    rarity: 'COMMON',
    points: 10,
    maxProgress: 1,
    triggerEvents: ['season.created', 'trophy.added'],
  },
  {
    key: 'career.five_clubs',
    title: 'Wandering Boss',
    description: 'Manage 5 distinct clubs in career stints',
    category: 'CAREER',
    rarity: 'RARE',
    points: 70,
    maxProgress: 5,
    triggerEvents: ['season.created', 'challenge.progress.updated'],
  },
  {
    key: 'career.ten_clubs',
    title: 'Globe-Trotter Manager',
    description: 'Manage 10 distinct clubs',
    category: 'CAREER',
    rarity: 'LEGENDARY',
    points: 150,
    maxProgress: 10,
    triggerEvents: ['season.created', 'challenge.progress.updated'],
  },
  {
    key: 'seasons.first',
    title: 'One Season In',
    description: 'Complete your first season entry',
    category: 'SEASONS_CONSISTENCY',
    rarity: 'COMMON',
    points: 10,
    maxProgress: 1,
    triggerEvents: ['season.created'],
  },
  {
    key: 'seasons.ten',
    title: 'Decade Dugout',
    description: 'Complete 10 seasons',
    category: 'SEASONS_CONSISTENCY',
    rarity: 'RARE',
    points: 80,
    maxProgress: 10,
    triggerEvents: ['season.created'],
  },
  {
    key: 'seasons.twenty_five',
    title: 'Dynasty Builder',
    description: 'Complete 25 seasons',
    category: 'SEASONS_CONSISTENCY',
    rarity: 'EPIC',
    points: 180,
    maxProgress: 25,
    triggerEvents: ['season.created'],
  },
];

export const ACHIEVEMENT_CATALOG_BY_KEY = new Map(
  ACHIEVEMENT_CATALOG.map((entry) => [entry.key, entry])
);
