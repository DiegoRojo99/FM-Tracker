import { config } from 'dotenv';
import admin from 'firebase-admin';
import { Pool } from 'pg';

config();

interface FirestoreChallenge {
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
  bonus?: string;
}

export async function migrateGlobalChallenges(firestore: admin.firestore.Firestore, pool: Pool) {
  console.log('🎯 Starting global challenges migration...');

  try {
    // 1. Fetch all global challenges from Firestore
    console.log('📥 Fetching global challenges from Firestore...');
    const challengesSnapshot = await firestore.collection('challenges').get();
    const firestoreChallenges = challengesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FirestoreChallenge[];

    console.log(`📊 Found ${firestoreChallenges.length} global challenges`);

    if (firestoreChallenges.length === 0) {
      console.log('ℹ️  No challenges to migrate');
      return { success: true, challengesCount: 0, goalsCount: 0, teamLinksCount: 0 };
    }

    // 2. Get reference data for FK validation
    console.log('🔍 Loading reference data for FK validation...');
    const [competitionGroups, teams, countries, games] = await Promise.all([
      pool.query(`
        SELECT cg.id, cg.name, array_agg(cgac."apiCompetitionId") as api_competition_ids
        FROM "CompetitionGroup" cg
        LEFT JOIN "CompetitionGroupApiCompetition" cgac ON cg.id = cgac."competitionGroupId"
        GROUP BY cg.id, cg.name
      `),
      pool.query('SELECT id FROM "Team"'),
      pool.query('SELECT code FROM "Country"'),
      pool.query('SELECT id, name FROM "Game"')
    ]);

    // Create lookup maps
    const competitionApiToGroupMap = new Map<string, number>();
    competitionGroups.rows.forEach(row => {
      if (row.api_competition_ids) {
        row.api_competition_ids.forEach((apiId: number) => {
          competitionApiToGroupMap.set(String(apiId), row.id);
        });
      }
    });

    const teamIdSet = new Set<number>();
    teams.rows.forEach(row => {
      teamIdSet.add(row.id);
    });

    const countryCodes = new Set(countries.rows.map(row => row.code));
    const gameNameToIdMap = new Map<string, number>();
    games.rows.forEach(row => {
      gameNameToIdMap.set(row.name.toLowerCase(), row.id);
    });

    console.log(`📋 Reference data loaded:`);
    console.log(`  Competition mappings: ${competitionApiToGroupMap.size}`);
    console.log(`  Team IDs: ${teamIdSet.size}`);
    console.log(`  Country codes: ${countryCodes.size}`);
    console.log(`  Games: ${gameNameToIdMap.size}`);

    // 3. Create challenge ID mapping table
    const challengeIdMapping = new Map<string, number>();
    let challengesInserted = 0;
    let goalsInserted = 0;
    let teamLinksInserted = 0;

    // 4. Insert challenges first to get auto-increment IDs
    console.log('📝 Inserting global challenges...');
    for (const challenge of firestoreChallenges) {
      const insertChallengeResult = await pool.query(`
        INSERT INTO "Challenge" (name, description, bonus, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING id
      `, [
        challenge.name,
        challenge.description,
        challenge.bonus || null
      ]);

      const challengeId = insertChallengeResult.rows[0].id;
      challengeIdMapping.set(challenge.id, challengeId);
      challengesInserted++;

      console.log(`  ✅ Challenge "${challenge.name}" → ID ${challengeId}`);
    }

    console.log(`✅ Inserted ${challengesInserted} challenges`);

    // 5. Insert challenge goals with FK validation
    console.log('🎯 Inserting challenge goals...');
    for (const challenge of firestoreChallenges) {
      const challengeId = challengeIdMapping.get(challenge.id)!;

      for (const goal of challenge.goals || []) {
        // Validate competition reference
        let competitionGroupId: number | null = null;
        if (goal.competitionId) {
          competitionGroupId = competitionApiToGroupMap.get(goal.competitionId) || null;
          if (!competitionGroupId) {
            console.warn(`⚠️  Unknown competition ID ${goal.competitionId} in challenge "${challenge.name}"`);
          }
        }

        // Validate country reference
        let countryCode: string | null = null;
        if (goal.countryId) {
          if (countryCodes.has(goal.countryId)) {
            countryCode = goal.countryId;
          } else {
            console.warn(`⚠️  Unknown country code ${goal.countryId} in challenge "${challenge.name}"`);
          }
        }

        // Insert challenge goal
        const insertGoalResult = await pool.query(`
          INSERT INTO "ChallengeGoal" ("challengeId", description, "competitionId", "countryId")
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `, [
          challengeId,
          goal.description,
          competitionGroupId,
          countryCode
        ]);

        const challengeGoalId = insertGoalResult.rows[0].id;
        goalsInserted++;

        console.log(`  ✅ Goal "${goal.description}" → ID ${challengeGoalId}`);

        // Insert team links if present
        if (goal.teamGroup && goal.teamGroup.length > 0) {
          for (const teamIdStr of goal.teamGroup) {
            const teamId = parseInt(teamIdStr);
            if (teamIdSet.has(teamId)) {
              await pool.query(`
                INSERT INTO "ChallengeGoalTeam" ("challengeGoalId", "teamId")
                VALUES ($1, $2)
              `, [challengeGoalId, teamId]);
              
              teamLinksInserted++;
              console.log(`    🔗 Linked to team ID ${teamId}`);
            } else {
              console.warn(`⚠️  Unknown team ID ${teamIdStr} in challenge "${challenge.name}"`);
            }
          }
        }
      }
    }

    console.log(`✅ Inserted ${goalsInserted} challenge goals`);
    console.log(`✅ Inserted ${teamLinksInserted} challenge-team links`);

    // Migration completed successfully
    console.log('💾 Challenge ID mapping created (available for this session)');

    return {
      success: true,
      challengesCount: challengesInserted,
      goalsCount: goalsInserted,
      teamLinksCount: teamLinksInserted,
      challengeIdMapping: Object.fromEntries(challengeIdMapping)
    };

  } catch (error) {
    console.error('❌ Global challenges migration failed:', error);
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
      const result = await migrateGlobalChallenges(firestore, pool);
      console.log('🎉 Global challenges migration completed!', result);
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