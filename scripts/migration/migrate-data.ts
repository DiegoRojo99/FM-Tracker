import { config } from 'dotenv';
import admin from 'firebase-admin';
import pkg from 'pg';
const { Pool } = pkg;

// Import migration functions
import { migrateUsers } from './migrations/migrate-users';
import { migrateGames } from './migrations/migrate-games';
import { migrateCountries } from './migrations/migrate-countries';
import { migrateTeams } from './migrations/migrate-teams';
import { migrateSaves } from './migrations/migrate-saves';
import { migrateCareerStints } from './migrations/migrate-career-stints';
import { migrateSeasons } from './migrations/migrate-seasons';
import { migrateApiCompetitions } from './migrations/migrate-api-competitions';
import { migrateApiCompetitionsTeams } from './migrations/migrate-api-competitions-teams';
import { migrateCompetitionGroups } from './migrations/migrate-competition-groups';
import { migrateCompetitionJunctions } from './migrations/migrate-competition-junctions';
import { migrateSeasonCompetitionData } from './migrations/migrate-season-competition-data';
import { migrateTrophies } from './migrations/migrate-trophies';
import { migrateGlobalChallenges } from './migrations/migrate-global-challenges';
import { migrateSupplementaryCompetitions } from './migrations/migrate-supplementary-competitions';
import { migrateCareerChallenges } from './migrations/migrate-career-challenges';

// Load environment variables
config();

interface MigrationStep {
  name: string;
  description: string;
  migrate: (firestore: any, pool: any) => Promise<any>;
}

const MIGRATION_STEPS: MigrationStep[] = [
  {
    name: 'users',
    description: 'Migrate user accounts from Firebase to PostgreSQL',
    migrate: migrateUsers,
  },
  {
    name: 'games',
    description: 'Migrate game data from Firebase to PostgreSQL',
    migrate: migrateGames,
  },
  {
    name: 'countries',
    description: 'Migrate country data from Firebase to PostgreSQL',
    migrate: migrateCountries,
  },
  {
    name: 'teams',
    description: 'Migrate team data from Firebase to PostgreSQL (depends on countries)',
    migrate: migrateTeams,
  },
  {
    name: 'saves',
    description: 'Migrate save data from Firebase to PostgreSQL (depends on users, games, teams)',
    migrate: migrateSaves,
  },
  {
    name: 'career-stints',
    description: 'Migrate career stints from Firebase to PostgreSQL (depends on saves, teams)',
    migrate: migrateCareerStints,
  },
  {
    name: 'seasons',
    description: 'Migrate season data from Firebase to PostgreSQL (depends on saves, teams)',
    migrate: migrateSeasons,
  },
  {
    name: 'api-competitions',
    description: 'Migrate API competition data from Firebase to PostgreSQL (depends on countries)',
    migrate: migrateApiCompetitions,
  },
  {
    name: 'api-competitions-teams',
    description: 'Migrate API competition teams from Firebase to PostgreSQL (depends on api-competitions, teams)',
    migrate: migrateApiCompetitionsTeams,
  },
  {
    name: 'competition-groups',
    description: 'Migrate admin competition groups from Firebase to PostgreSQL (depends on countries)',
    migrate: migrateCompetitionGroups,
  },
  {
    name: 'supplementary-competitions',
    description: 'Add missing competitions referenced by challenges with inFootballManager=true (depends on countries)',
    migrate: migrateSupplementaryCompetitions,
  },
  {
    name: 'competition-junctions',
    description: 'Create junction table linking competition groups with API competitions (depends on api-competitions, competition-groups)',
    migrate: migrateCompetitionJunctions,
  },
  {
    name: 'season-competition-data',
    description: 'Migrate cup results and league results for seasons (depends on seasons, competition-junctions)',
    migrate: migrateSeasonCompetitionData,
  },
  {
    name: 'trophies',
    description: 'Migrate trophies from save collections to Trophy table (depends on teams, competition-junctions, games, saves)',
    migrate: migrateTrophies,
  },
  {
    name: 'global-challenges',
    description: 'Migrate global challenge templates from Firebase to PostgreSQL (depends on teams, competition-junctions, countries)',
    migrate: migrateGlobalChallenges,
  },
  {
    name: 'career-challenges',
    description: 'Migrate user career challenge progress from save subcollections (depends on global-challenges, saves, games)',
    migrate: migrateCareerChallenges,
  },
];

async function runMigration(stepNames?: string[]) {
  console.log('🚀 Starting Firebase to PostgreSQL migration...\n');

  // Initialize Firebase Admin
  const firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });

  const firestore = admin.firestore(firebaseApp);

  // Initialize PostgreSQL pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Test database connection
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL connected\n');

    // Determine which steps to run
    const stepsToRun = stepNames 
      ? MIGRATION_STEPS.filter(step => stepNames.includes(step.name))
      : MIGRATION_STEPS;

    if (stepNames && stepsToRun.length !== stepNames.length) {
      const notFound = stepNames.filter(name => !MIGRATION_STEPS.find(s => s.name === name));
      console.error(`❌ Unknown migration steps: ${notFound.join(', ')}`);
      console.log('Available steps:', MIGRATION_STEPS.map(s => s.name).join(', '));
      process.exit(1);
    }

    let totalSuccess = 0;
    const startTime = Date.now();

    for (const step of stepsToRun) {
      console.log(`📦 Running migration: ${step.name}`);
      console.log(`   ${step.description}\n`);
      
      try {
        const stepStart = Date.now();
        const result = await step.migrate(firestore, pool);
        const duration = Date.now() - stepStart;
        
        console.log(`✅ ${step.name} migration completed (${duration}ms)`);
        if (result) {
          const { migratedCount, updatedCount, errorCount } = result;
          if (errorCount === 0) {
            totalSuccess++;
          }
        }
        console.log('');
        
      } catch (error) {
        console.error(`❌ Failed to run migration ${step.name}:`);
        console.error(error);
        console.log('');
        
        // Check if we should continue or stop
        const shouldContinue = process.argv.includes('--continue-on-error');
        if (!shouldContinue) {
          console.log('💡 Use --continue-on-error to continue despite failures');
          break;
        }
      }
    }

    const totalDuration = Date.now() - startTime;
    console.log(`🎉 Migration session completed!`);
    console.log(`   ${totalSuccess}/${stepsToRun.length} steps successful`);
    console.log(`   Total time: ${totalDuration}ms`);
    
  } catch (error) {
    console.error('💥 Migration setup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const stepNames: string[] = [];
  
  for (const arg of args) {
    if (arg.startsWith('--')) continue;
    stepNames.push(arg);
  }
  
  return stepNames.length > 0 ? stepNames : undefined;
}

// CLI Help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('🚀 Firebase to PostgreSQL Data Migration Tool\n');
  console.log('Usage: npm run migrate:data [steps...] [options]\n');
  console.log('Available steps:');
  MIGRATION_STEPS.forEach(step => {
    console.log(`  ${step.name.padEnd(15)} - ${step.description}`);
  });
  console.log('\nOptions:');
  console.log('  --continue-on-error  Continue migration even if a step fails');
  console.log('  --help, -h           Show this help message');
  console.log('\nExamples:');
  console.log('  npm run migrate:data                    # Run all migrations');
  console.log('  npm run migrate:data users              # Run specific migration');
  console.log('  npm run migrate:data users --continue-on-error');
  process.exit(0);
}

// Run the migration
if (require.main === module) {
  const stepNames = parseArgs();
  runMigration(stepNames)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { runMigration, MIGRATION_STEPS };