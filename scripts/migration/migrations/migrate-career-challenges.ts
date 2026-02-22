import { config } from 'dotenv';
import admin from 'firebase-admin';
import { Pool } from 'pg';

config();

interface FirestoreCareerChallenge {
  id: string;
  name: string;
  description: string;
  goals: Array<{
    id: string;
    description: string;
    competitionId?: string;
    teamGroup?: string[];
    countryId?: string;
  }>;
  completedGoals: string[];
  startedAt: string;
  completedAt?: string;
  gameId: string;
  updatedAt?: any;
}

interface MigrationContext {
  challengeIdMapping: { [key: string]: number };
  saveIdSet: Set<string>;
  gameNameToIdMap: Map<string, number>;
  challengeGoalMap: Map<string, any[]>;
}

interface CareerChallengeData {
  userId: string;
  saveId: string;
  challenge: FirestoreCareerChallenge;
}

async function loadChallengeMapping(pool: Pool): Promise<{ [key: string]: number }> {
  console.log('📋 Loading challenges from database...');
  const challengesResult: { rows: { id: number; name: string }[] } = await pool.query(`SELECT id, name FROM "Challenge"`);

  if (challengesResult.rows.length === 0) {
    throw new Error('No challenges found in database. Please run global challenges migration first.');
  }

  const challengeIdMapping: { [key: string]: number } = {};
  challengesResult.rows.forEach(row => {
    challengeIdMapping[row.name] = row.id;
  });
  
  console.log(`Found ${Object.keys(challengeIdMapping).length} challenges in database`);
  return challengeIdMapping;
}

async function loadReferenceData(pool: Pool): Promise<{
  saveIdSet: Set<string>;
  gameNameToIdMap: Map<string, number>;
  challengeGoalMap: Map<string, any[]>;
}> {
  console.log('🔍 Loading reference data...');
  const [savesQueryResult, gamesQueryResult, challengeGoalsQueryResult] = await Promise.all([
    pool.query('SELECT id, "userId" FROM "Save"'),
    pool.query('SELECT id, name FROM "Game"'),
    pool.query(`
      SELECT cg.id, cg."challengeId", cg.description, c.name as challenge_name
      FROM "ChallengeGoal" cg
      JOIN "Challenge" c ON cg."challengeId" = c.id
    `)
  ]);

  const saveIdSet: Set<string> = new Set(savesQueryResult.rows.map(row => row.id));
  const gameNameToIdMap = new Map<string, number>();
  gamesQueryResult.rows.forEach(row => {
    const name = row.name.toLowerCase();
    gameNameToIdMap.set(name, row.id);
    if (name.includes('football manager 2024')) {
      gameNameToIdMap.set('fm24', row.id);
      gameNameToIdMap.set('unknown', row.id);
    }
  });

  const challengeGoalMap = new Map<string, any[]>();
  challengeGoalsQueryResult.rows.forEach(row => {
    const challengeIdKey = row.challengeId.toString();
    if (!challengeGoalMap.has(challengeIdKey)) {
      challengeGoalMap.set(challengeIdKey, []);
    }
    challengeGoalMap.get(challengeIdKey)!.push(row);
  });

  console.log(`📊 Reference data loaded:`);
  console.log(`  Save IDs: ${saveIdSet.size}`);
  console.log(`  Game mappings: ${gameNameToIdMap.size}`);
  console.log(`  Challenge goals: ${challengeGoalsQueryResult.rows.length}`);

  return { saveIdSet, gameNameToIdMap, challengeGoalMap };
}

async function scanFirestoreCareerChallenges(firestore: admin.firestore.Firestore): Promise<CareerChallengeData[]> {
  console.log('👥 Scanning user saves for career challenges...');
  
  const usersSnapshot = await firestore.collection('users').get();
  console.log(`Checking ${usersSnapshot.docs.length} users...`);

  const careerChallenges: CareerChallengeData[] = [];

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    
    try {
      const savesSnapshot = await firestore.collection('users').doc(userId).collection('saves').get();
      
      for (const saveDoc of savesSnapshot.docs) {
        const saveId = saveDoc.id;
        
        try {
          const challengesSnapshot = await firestore
            .collection('users').doc(userId)
            .collection('saves').doc(saveId)
            .collection('challenges').get();
          
          challengesSnapshot.docs.forEach(challengeDoc => {
            const challenge = challengeDoc.data() as FirestoreCareerChallenge;
            careerChallenges.push({
              userId,
              saveId,
              challenge
            });
          });
        } catch (error) {
          continue; // Skip saves with challenge access errors
        }
      }
    } catch (error) {
      continue; // Skip users with save access errors
    }
  }

  console.log(`📊 Found ${careerChallenges.length} career challenges across all users`);
  return careerChallenges;
}

async function migrateCareerChallenge(
  careerChallengeData: CareerChallengeData,
  context: MigrationContext,
  pool: Pool
): Promise<{ success: boolean; goalsInserted: number; errorMessage?: string }> {
  const { userId, saveId, challenge } = careerChallengeData;
  const { challengeIdMapping, saveIdSet, gameNameToIdMap, challengeGoalMap } = context;

  try {
    // Validate references
    if (!saveIdSet.has(saveId)) {
      return { success: false, goalsInserted: 0, errorMessage: `Save ${saveId} not found in database` };
    }

    const globalChallengeId = challengeIdMapping[challenge.name];
    if (!globalChallengeId) {
      return { success: false, goalsInserted: 0, errorMessage: `Global challenge "${challenge.name}" not found` };
    }

    const gameId = gameNameToIdMap.get(challenge.gameId?.toLowerCase()) || gameNameToIdMap.get('unknown');
    if (!gameId) {
      return { success: false, goalsInserted: 0, errorMessage: `Game ${challenge.gameId} not found` };
    }

    // Parse timestamps
    const startedAt = new Date(challenge.startedAt);
    const completedAt = challenge.completedAt ? new Date(challenge.completedAt) : null;

    // Insert or get existing career challenge
    let careerChallengeId: number;
    
    try {
      // Try to insert new career challenge
      const insertResult = await pool.query(`
        INSERT INTO "CareerChallenge" ("userId", "challengeId", "saveId", "gameId", "startedAt", "completedAt")
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [userId, globalChallengeId, saveId, gameId, startedAt, completedAt]);
      
      careerChallengeId = insertResult.rows[0].id;
      console.log(`  ✅ Career Challenge: ${challenge.name} (Save: ${saveId}) → ID ${careerChallengeId} [NEW]`);
      
    } catch (insertError: any) {
      // If insert failed due to unique constraint, get existing challenge ID
      if (insertError.code === '23505') { // PostgreSQL unique constraint violation
        const existingResult = await pool.query(`
          SELECT id FROM "CareerChallenge" 
          WHERE "userId" = $1 AND "challengeId" = $2 AND "saveId" = $3
        `, [userId, globalChallengeId, saveId]);
        
        if (existingResult.rows.length > 0) {
          careerChallengeId = existingResult.rows[0].id;
          console.log(`  ♻️  Career Challenge: ${challenge.name} (Save: ${saveId}) → ID ${careerChallengeId} [EXISTS]`);
        } else {
          throw insertError; // Re-throw if we can't find existing record
        }
      } else {
        throw insertError; // Re-throw non-constraint errors
      }
    }

    // Insert career challenge goals
    const challengeGoals = challengeGoalMap.get(globalChallengeId.toString()) || [];
    console.log(`    🎯 Found ${challengeGoals.length} goals for challenge "${challenge.name}" (ID: ${globalChallengeId})`);
    
    let goalsInserted = 0;
    for (const challengeGoal of challengeGoals) {
      const isCompleted = challenge.completedGoals?.includes(challengeGoal.id.toString()) || false;
      const goalCompletedAt = isCompleted ? completedAt : null;

      try {
        // Try to insert new goal
        await pool.query(`
          INSERT INTO "CareerChallengeGoal" ("careerChallengeId", "challengeGoalId", "isComplete", "completedAt", "createdAt")
          VALUES ($1, $2, $3, $4, NOW())
        `, [careerChallengeId, challengeGoal.id, isCompleted, goalCompletedAt]);

        goalsInserted++;

        if (isCompleted) {
          console.log(`    ✅ Completed goal: ${challengeGoal.description} [NEW]`);
        } else {
          console.log(`    ⏳ Pending goal: ${challengeGoal.description} [NEW]`);
        }
        
      } catch (goalError: any) {
        // Handle unique constraint violations for existing goals
        if (goalError.code === '23505') {
          // Goal already exists, optionally update completion status
          try {
            await pool.query(`
              UPDATE "CareerChallengeGoal" 
              SET "isComplete" = $1, "completedAt" = $2
              WHERE "careerChallengeId" = $3 AND "challengeGoalId" = $4
            `, [isCompleted, goalCompletedAt, careerChallengeId, challengeGoal.id]);
            
            if (isCompleted) {
              console.log(`    ✅ Completed goal: ${challengeGoal.description} [UPDATED]`);
            } else {
              console.log(`    ⏳ Pending goal: ${challengeGoal.description} [EXISTS]`);
            }
          } catch (updateError) {
            console.error(`    ❌ Failed to update existing goal ${challengeGoal.id}: ${(updateError as Error).message}`);
          }
        } else {
          console.error(`    ❌ Failed to insert goal ${challengeGoal.id}: ${goalError.message}`);
        }
      }
    }

    return { success: true, goalsInserted };
  } catch (error: unknown) {
    return { success: false, goalsInserted: 0, errorMessage: (error as Error).message };
  }
}

export async function migrateCareerChallenges(firestore: admin.firestore.Firestore, pool: Pool) {
  console.log('🏃 Starting career challenges migration...');

  try {
    // 1. Load all reference data
    const [challengeIdMapping, referenceData] = await Promise.all([
      loadChallengeMapping(pool),
      loadReferenceData(pool)
    ]);

    const context: MigrationContext = {
      challengeIdMapping,
      ...referenceData
    };

    // 2. Scan Firestore for career challenges
    const careerChallenges = await scanFirestoreCareerChallenges(firestore);

    if (careerChallenges.length === 0) {
      console.log('ℹ️  No career challenges to migrate');
      return { success: true, careerChallengesCount: 0, careerGoalsCount: 0 };
    }

    // 3. Migrate career challenges
    console.log('🏗️  Migrating career challenges...');
    
    let careerChallengesInserted = 0;
    let careerGoalsInserted = 0;
    const skippedChallenges: string[] = [];

    for (const careerChallengeData of careerChallenges) {
      const result = await migrateCareerChallenge(careerChallengeData, context, pool);
      
      if (result.success) {
        careerChallengesInserted++;
        careerGoalsInserted += result.goalsInserted;
      } 
      else {
        console.warn(`⚠️  ${result.errorMessage}, skipping challenge "${careerChallengeData.challenge.name}"`);
        if (result.errorMessage?.includes('Global challenge')) {
          skippedChallenges.push(careerChallengeData.challenge.name);
        }
      }
    }

    console.log(`\n✅ Career challenges migration completed!`);
    console.log(`  Career challenges migrated: ${careerChallengesInserted}`);
    console.log(`  Career goals migrated: ${careerGoalsInserted}`);
    
    if (skippedChallenges.length > 0) {
      console.log(`  Skipped unknown challenge names: ${[...new Set(skippedChallenges)].join(', ')}`);
    }

    return {
      success: true,
      careerChallengesCount: careerChallengesInserted,
      careerGoalsCount: careerGoalsInserted,
      skippedChallenges: [...new Set(skippedChallenges)]
    };

  } catch (error: unknown) {
    console.error('❌ Career challenges migration failed:', (error as Error).message);
    throw error;
  }
}

if (require.main === module) {
  async function runMigration() {
    // Initialize Firebase
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
      });
    }

    const firestore = admin.firestore();

    // Initialize PostgreSQL
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    try {
      const result = await migrateCareerChallenges(firestore, pool);
      console.log('🎉 Career challenges migration completed!', result);
      process.exit(0);
    } catch (error) {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    } finally {
      await pool.end();
    }
  }

  runMigration();
}