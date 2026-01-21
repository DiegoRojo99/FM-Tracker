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

export async function migrateCareerChallenges(firestore: admin.firestore.Firestore, pool: Pool) {
  console.log('🏃 Starting career challenges migration...');

  try {
    // 1. Get challenge ID mapping from global challenges migration
    console.log('📋 Loading global challenge ID mapping...');
    const mappingResult = await pool.query(`
      SELECT mapping_data FROM "_migration_mappings" WHERE entity_type = 'challenge_ids'
    `);

    if (mappingResult.rows.length === 0) {
      throw new Error('Challenge ID mapping not found. Please run global challenges migration first.');
    }

    const challengeIdMapping = mappingResult.rows[0].mapping_data;
    console.log(`Found challenge ID mappings for ${Object.keys(challengeIdMapping).length} challenges`);

    // 2. Get reference data for validation
    console.log('🔍 Loading reference data...');
    const [saves, games, challengeGoals] = await Promise.all([
      pool.query('SELECT id, "userId" FROM "Save"'),
      pool.query('SELECT id, name FROM "Game"'),
      pool.query(`
        SELECT cg.id, cg."challengeId", cg.description, c.name as challenge_name
        FROM "ChallengeGoal" cg
        JOIN "Challenge" c ON cg."challengeId" = c.id
      `)
    ]);

    const saveIdSet = new Set(saves.rows.map(row => row.id));
    const gameNameToIdMap = new Map<string, number>();
    games.rows.forEach(row => {
      // Map common game name variations
      const name = row.name.toLowerCase();
      gameNameToIdMap.set(name, row.id);
      if (name.includes('football manager 2024')) {
        gameNameToIdMap.set('fm24', row.id);
        gameNameToIdMap.set('unknown', row.id); // Default unknown to FM24
      }
    });

    // Create goal mapping for completion tracking
    const challengeGoalMap = new Map<string, any[]>();
    challengeGoals.rows.forEach(row => {
      if (!challengeGoalMap.has(row.challengeId)) {
        challengeGoalMap.set(row.challengeId, []);
      }
      challengeGoalMap.get(row.challengeId)!.push(row);
    });

    console.log(`📊 Reference data loaded:`);
    console.log(`  Save IDs: ${saveIdSet.size}`);
    console.log(`  Game mappings: ${gameNameToIdMap.size}`);
    console.log(`  Challenge goals: ${challengeGoals.rows.length}`);

    // 3. Scan all user saves for career challenges
    console.log('👥 Scanning user saves for career challenges...');
    
    const usersSnapshot = await firestore.collection('users').get();
    console.log(`Checking ${usersSnapshot.docs.length} users...`);

    const careerChallenges: Array<{
      userId: string;
      saveId: string;
      challenge: FirestoreCareerChallenge;
    }> = [];

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
            // Skip saves with challenge access errors
            continue;
          }
        }
      } catch (error) {
        // Skip users with save access errors
        continue;
      }
    }

    console.log(`📊 Found ${careerChallenges.length} career challenges across all users`);

    if (careerChallenges.length === 0) {
      console.log('ℹ️  No career challenges to migrate');
      return { success: true, careerChallengesCount: 0, careerGoalsCount: 0 };
    }

    // 4. Migrate career challenges
    console.log('🏗️  Migrating career challenges...');
    
    let careerChallengesInserted = 0;
    let careerGoalsInserted = 0;
    const skippedChallenges: string[] = [];

    for (const { userId, saveId, challenge } of careerChallenges) {
      try {
        // Validate references
        if (!saveIdSet.has(saveId)) {
          console.warn(`⚠️  Save ${saveId} not found in database, skipping challenge`);
          continue;
        }

        const globalChallengeId = challengeIdMapping[challenge.id];
        if (!globalChallengeId) {
          skippedChallenges.push(challenge.id);
          console.warn(`⚠️  Global challenge ${challenge.id} not found, skipping`);
          continue;
        }

        const gameId = gameNameToIdMap.get(challenge.gameId?.toLowerCase()) || gameNameToIdMap.get('unknown');
        if (!gameId) {
          console.warn(`⚠️  Game ${challenge.gameId} not found, skipping challenge`);
          continue;
        }

        // Parse timestamps
        const startedAt = new Date(challenge.startedAt);
        const completedAt = challenge.completedAt ? new Date(challenge.completedAt) : null;

        // Insert career challenge
        const insertCareerChallengeResult = await pool.query(`
          INSERT INTO "CareerChallenge" ("userId", "challengeId", "saveId", "gameId", "startedAt", "completedAt")
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `, [
          userId,
          globalChallengeId,
          saveId,
          gameId,
          startedAt,
          completedAt
        ]);

        const careerChallengeId = insertCareerChallengeResult.rows[0].id;
        careerChallengesInserted++;

        console.log(`  ✅ Career Challenge: ${challenge.name} (Save: ${saveId}) → ID ${careerChallengeId}`);

        // Insert career challenge goals with completion status
        const challengeGoals = challengeGoalMap.get(globalChallengeId) || [];
        for (const challengeGoal of challengeGoals) {
          const isCompleted = challenge.completedGoals?.includes(challengeGoal.id) || false;
          const goalCompletedAt = isCompleted ? completedAt : null;

          await pool.query(`
            INSERT INTO "CareerChallengeGoal" ("careerChallengeId", "challengeGoalId", "isComplete", "completedAt", "createdAt")
            VALUES ($1, $2, $3, $4, NOW())
          `, [
            careerChallengeId,
            challengeGoal.id,
            isCompleted,
            goalCompletedAt
          ]);

          careerGoalsInserted++;

          if (isCompleted) {
            console.log(`    ✅ Completed goal: ${challengeGoal.description}`);
          } else {
            console.log(`    ⏳ Pending goal: ${challengeGoal.description}`);
          }
        }

      } catch (error) {
        console.error(`❌ Failed to migrate career challenge ${challenge.name}:`, error);
      }
    }

    console.log(`\n✅ Career challenges migration completed!`);
    console.log(`  Career challenges migrated: ${careerChallengesInserted}`);
    console.log(`  Career goals migrated: ${careerGoalsInserted}`);
    
    if (skippedChallenges.length > 0) {
      console.log(`  Skipped unknown challenge IDs: ${[...new Set(skippedChallenges)].join(', ')}`);
    }

    return {
      success: true,
      careerChallengesCount: careerChallengesInserted,
      careerGoalsCount: careerGoalsInserted,
      skippedChallenges: [...new Set(skippedChallenges)]
    };

  } catch (error) {
    console.error('❌ Career challenges migration failed:', error);
    throw error;
  }
}

if (require.main === module) {
  // This would need proper initialization for standalone execution
  console.log('Career challenges migration module loaded');
}