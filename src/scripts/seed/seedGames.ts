import { prisma } from "@/lib/db/prisma";

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
  }
];

export async function seedGames() {
  console.log('Starting games seeding...');
  
  try {    
    for (const game of initialGames) {
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
    
    console.log('Games seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding games:', error);
    throw error;
  }
}

// Function to run the seeding
if (require.main === module) {
  seedGames()
    .then(() => {
      console.log('Seeding process completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding process failed:', error);
      process.exit(1);
    });
}