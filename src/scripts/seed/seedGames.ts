import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Using a simpler type for seeding since we're bypassing the client-side types
type SeedGame = {
  id: string;
  name: string;
  shortName: string;
  version: string;
  platform: 'PC' | 'Mobile' | 'Console';
  variant: 'Standard' | 'Touch';
  releaseDate: Date; // Using Date, will be converted by admin SDK
  isActive: boolean;
  sortOrder: number;
  logoUrl?: string;
};

const initialGames: SeedGame[] = [
  {
    id: 'fm24',
    name: 'Football Manager 2024',
    shortName: 'FM24',
    version: '2024',
    platform: 'PC',
    variant: 'Standard',
    releaseDate: new Date('2023-11-06'), // Typical FM release date
    isActive: true,
    sortOrder: 1,
    logoUrl: '/FM24-logo.png' // You can add this later
  },
  {
    id: 'fm24-touch',
    name: 'Football Manager 2024 Touch',
    shortName: 'FM24 Touch',
    version: '2024',
    platform: 'Mobile',
    variant: 'Touch',
    releaseDate: new Date('2023-11-06'),
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'fm26',
    name: 'Football Manager 2026',
    shortName: 'FM26',
    version: '2026',
    platform: 'PC',
    variant: 'Standard',
    releaseDate: new Date('2025-11-04'),
    isActive: true,
    sortOrder: 4,
  },
  {
    id: 'fm27',
    name: 'Football Manager 2027',
    shortName: 'FM27',
    version: '2027',
    platform: 'PC',
    variant: 'Standard',
    releaseDate: new Date('2026-11-04'),
    isActive: true,
    sortOrder: 5,
  }
];

function loadSeedEnvironment() {
  const baseEnvPath = resolve(process.cwd(), '.env');
  if (existsSync(baseEnvPath)) config({ path: baseEnvPath });
  else config();

  const envFile = process.env.NODE_ENV === 'production'
    ? '.env.production.local'
    : '.env.development.local';
  const envPath = resolve(process.cwd(), envFile);
  if (existsSync(envPath)) config({ path: envPath, override: true });
}

export async function seedGames(gameId?: string) {
  loadSeedEnvironment();

  const gamesToSeed = gameId
    ? initialGames.filter((game) => game.id === gameId)
    : initialGames;
  if (gamesToSeed.length === 0) {
    throw new Error(`Unknown game ID: ${gameId}`);
  }

  const { prisma } = await import('@/lib/db/prisma');
  console.log('Starting games seeding...');
  
  try {    
    for (const game of gamesToSeed) {
      const { id, ...gameData } = game;
      
      await prisma.game.upsert({
        where: { id: id },
        create: {
          id,
          ...gameData,
          logoUrl: game.logoUrl || '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        update: {
          ...gameData,
          logoUrl: game.logoUrl || '',
          updatedAt: new Date(),
        },
      });
      console.log(`✓ Seeded: ${game.name}`);
    }

    for (const game of gamesToSeed) {
      const seededGame = await prisma.game.findUnique({ where: { id: game.id } });
      if (!seededGame || seededGame.shortName !== game.shortName || !seededGame.isActive) {
        throw new Error(`Game verification failed for ${game.id}`);
      }
    }
    
    console.log('Games seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding games:', error);
    throw error;
  }
}

// Function to run the seeding
if (require.main === module) {
  seedGames(process.argv[2])
    .then(() => {
      console.log('Seeding process completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding process failed:', error);
      process.exit(1);
    });
}