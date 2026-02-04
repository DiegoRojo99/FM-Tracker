import { config } from 'dotenv';
import { Pool } from 'pg';

config();

async function cleanupDuplicateCareerChallenges() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🧹 Starting career challenge cleanup process...');

    // Get all duplicate career challenges with their IDs and related data
    const duplicatesQuery = `
      WITH career_challenge_ranks AS (
        SELECT 
          id,
          "userId",
          "challengeId",
          "saveId",
          "startedAt",
          "completedAt",
          ROW_NUMBER() OVER (
            PARTITION BY "userId", "challengeId", "saveId" 
            ORDER BY "startedAt" ASC, id ASC
          ) as rn
        FROM "CareerChallenge"
        WHERE "saveId" IS NOT NULL
      ),
      challenges_to_keep AS (
        SELECT id as keeper_id, "userId", "challengeId", "saveId"
        FROM career_challenge_ranks 
        WHERE rn = 1
      ),
      challenges_to_remove AS (
        SELECT cc.id as remove_id, ctk.keeper_id, cc."userId", cc."challengeId", cc."saveId"
        FROM "CareerChallenge" cc
        JOIN challenges_to_keep ctk ON 
          cc."userId" = ctk."userId" AND 
          cc."challengeId" = ctk."challengeId" AND 
          cc."saveId" = ctk."saveId"
        WHERE cc.id != ctk.keeper_id
      )
      SELECT 
        remove_id,
        keeper_id,
        "userId",
        "challengeId",
        "saveId",
        (SELECT COUNT(*) FROM "CareerChallengeGoal" ccg WHERE ccg."careerChallengeId" = remove_id) as goal_progress_count
      FROM challenges_to_remove
      ORDER BY "userId", "challengeId", "saveId", remove_id;
    `;

    const duplicateResult = await pool.query(duplicatesQuery);
    console.log(`📊 Found ${duplicateResult.rows.length} duplicate career challenges to remove`);

    if (duplicateResult.rows.length === 0) {
      console.log('✅ No duplicate career challenges found');
      return;
    }

    // Start transaction
    await pool.query('BEGIN');

    try {
      // Process each duplicate career challenge
      for (const duplicate of duplicateResult.rows) {
        const { remove_id, keeper_id, userId, challengeId, saveId, goal_progress_count } = duplicate;
        
        console.log(`Processing duplicate: User ${userId}, Challenge ${challengeId}, Save ${saveId}`);
        console.log(`  - Removing ID ${remove_id}, keeping ID ${keeper_id}`);
        console.log(`  - Goal progress to reassign: ${goal_progress_count}`);

        // Update CareerChallengeGoals to point to the keeper career challenge
        if (goal_progress_count > 0) {
          // First, we need to handle potential duplicate goal progress
          // Check if keeper already has progress for the same goal
          const goalMergeQuery = `
            WITH goals_to_keep AS (
              SELECT DISTINCT "challengeGoalId", 
                     BOOL_OR("isComplete") as is_complete,
                     MIN("completedAt") FILTER (WHERE "completedAt" IS NOT NULL) as completed_at
              FROM "CareerChallengeGoal"
              WHERE "careerChallengeId" IN ($1, $2)
              GROUP BY "challengeGoalId"
            ),
            existing_keeper_goals AS (
              SELECT "challengeGoalId"
              FROM "CareerChallengeGoal"
              WHERE "careerChallengeId" = $2
            ),
            goals_to_move AS (
              SELECT ccg.id, ccg."challengeGoalId"
              FROM "CareerChallengeGoal" ccg
              WHERE ccg."careerChallengeId" = $1
              AND NOT EXISTS (
                SELECT 1 FROM existing_keeper_goals ekg
                WHERE ekg."challengeGoalId" = ccg."challengeGoalId"
              )
            ),
            goals_to_update AS (
              SELECT ccg.id
              FROM "CareerChallengeGoal" ccg
              JOIN goals_to_keep gtk ON ccg."challengeGoalId" = gtk."challengeGoalId"
              WHERE ccg."careerChallengeId" = $2
              AND gtk.is_complete = true
              AND ccg."isComplete" = false
            )
            -- First move unique goals
            UPDATE "CareerChallengeGoal"
            SET "careerChallengeId" = $2
            WHERE id IN (SELECT id FROM goals_to_move);
          `;
          
          await pool.query(goalMergeQuery, [remove_id, keeper_id]);

          // Update keeper goals to completed if any duplicate was completed
          const updateCompletedQuery = `
            UPDATE "CareerChallengeGoal" keeper
            SET "isComplete" = true, 
                "completedAt" = COALESCE(keeper."completedAt", dup."completedAt")
            FROM "CareerChallengeGoal" dup
            WHERE keeper."careerChallengeId" = $2
            AND dup."careerChallengeId" = $1
            AND keeper."challengeGoalId" = dup."challengeGoalId"
            AND dup."isComplete" = true
            AND keeper."isComplete" = false;
          `;

          await pool.query(updateCompletedQuery, [remove_id, keeper_id]);

          // Delete remaining duplicate goal progress
          await pool.query(`
            DELETE FROM "CareerChallengeGoal" 
            WHERE "careerChallengeId" = $1
          `, [remove_id]);
        }

        // Delete the duplicate career challenge
        await pool.query(`
          DELETE FROM "CareerChallenge" 
          WHERE id = $1
        `, [remove_id]);

        console.log(`✅ Removed duplicate career challenge: ID ${remove_id}`);
      }

      // Commit transaction
      await pool.query('COMMIT');
      console.log('✅ Career challenge cleanup completed successfully');

      // Show final stats
      const finalStats = await pool.query(`
        SELECT 
          COUNT(*) as total_career_challenges,
          COUNT(DISTINCT ("userId", "challengeId", "saveId")) as unique_combinations
        FROM "CareerChallenge"
        WHERE "saveId" IS NOT NULL
      `);

      console.log(`📊 Final stats: ${finalStats.rows[0].total_career_challenges} total career challenges, ${finalStats.rows[0].unique_combinations} unique combinations`);

    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('❌ Error during career challenge cleanup:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  cleanupDuplicateCareerChallenges()
    .then(() => {
      console.log('🎉 Career challenge cleanup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Career challenge cleanup failed:', error);
      process.exit(1);
    });
}

export { cleanupDuplicateCareerChallenges };