import { config } from 'dotenv';
import { Pool } from 'pg';

config();

async function cleanupDuplicateChallenges() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🧹 Starting challenge cleanup process...');

    // Get all duplicate challenges with their IDs and related data
    const duplicatesQuery = `
      WITH challenge_ranks AS (
        SELECT 
          id,
          name,
          ROW_NUMBER() OVER (PARTITION BY name ORDER BY id ASC) as rn
        FROM "Challenge"
      ),
      challenges_to_keep AS (
        SELECT id as keeper_id, name
        FROM challenge_ranks 
        WHERE rn = 1
      ),
      challenges_to_remove AS (
        SELECT c.id as remove_id, ctk.keeper_id, c.name
        FROM "Challenge" c
        JOIN challenges_to_keep ctk ON c.name = ctk.name
        WHERE c.id != ctk.keeper_id
      )
      SELECT 
        remove_id,
        keeper_id,
        name,
        (SELECT COUNT(*) FROM "ChallengeGoal" cg WHERE cg."challengeId" = remove_id) as goal_count,
        (SELECT COUNT(*) FROM "CareerChallenge" cc WHERE cc."challengeId" = remove_id) as career_challenge_count
      FROM challenges_to_remove
      ORDER BY name, remove_id;
    `;

    const duplicateResult = await pool.query(duplicatesQuery);
    console.log(`📊 Found ${duplicateResult.rows.length} duplicate challenges to remove`);

    if (duplicateResult.rows.length === 0) {
      console.log('✅ No duplicate challenges found');
      return;
    }

    // Start transaction
    await pool.query('BEGIN');

    try {
      // Process each duplicate challenge
      for (const duplicate of duplicateResult.rows) {
        const { remove_id, keeper_id, name, goal_count, career_challenge_count } = duplicate;
        
        console.log(`Processing duplicate challenge: ${name} (removing ID ${remove_id}, keeping ID ${keeper_id})`);
        console.log(`  - Goals to reassign: ${goal_count}`);
        console.log(`  - Career challenges to reassign: ${career_challenge_count}`);

        // Update ChallengeGoals to point to the keeper challenge
        if (goal_count > 0) {
          // First, we need to handle potential duplicate goals
          // Get all goals for both challenges and merge them intelligently
          const goalMergeQuery = `
            WITH goals_to_keep AS (
              SELECT DISTINCT description, "competitionId", "countryId"
              FROM "ChallengeGoal"
              WHERE "challengeId" IN ($1, $2)
            ),
            existing_keeper_goals AS (
              SELECT id, description, "competitionId", "countryId"
              FROM "ChallengeGoal"
              WHERE "challengeId" = $2
            ),
            goals_to_move AS (
              SELECT cg.id, cg.description, cg."competitionId", cg."countryId"
              FROM "ChallengeGoal" cg
              WHERE cg."challengeId" = $1
              AND NOT EXISTS (
                SELECT 1 FROM existing_keeper_goals ekg
                WHERE ekg.description = cg.description
                AND ekg."competitionId" IS NOT DISTINCT FROM cg."competitionId"
                AND ekg."countryId" IS NOT DISTINCT FROM cg."countryId"
              )
            )
            UPDATE "ChallengeGoal"
            SET "challengeId" = $2
            WHERE id IN (SELECT id FROM goals_to_move);
          `;
          
          await pool.query(goalMergeQuery, [remove_id, keeper_id]);

          // Delete remaining duplicate goals that couldn't be moved
          await pool.query(`
            DELETE FROM "ChallengeGoal" 
            WHERE "challengeId" = $1
          `, [remove_id]);
        }

        // Update CareerChallenges to point to the keeper challenge
        if (career_challenge_count > 0) {
          await pool.query(`
            UPDATE "CareerChallenge" 
            SET "challengeId" = $1 
            WHERE "challengeId" = $2
          `, [keeper_id, remove_id]);
        }

        // Delete the duplicate challenge
        await pool.query(`
          DELETE FROM "Challenge" 
          WHERE id = $1
        `, [remove_id]);

        console.log(`✅ Removed duplicate challenge: ${name} (ID ${remove_id})`);
      }

      // Commit transaction
      await pool.query('COMMIT');
      console.log('✅ Challenge cleanup completed successfully');

      // Show final stats
      const finalStats = await pool.query(`
        SELECT 
          COUNT(*) as total_challenges,
          COUNT(DISTINCT name) as unique_challenges
        FROM "Challenge"
      `);

      console.log(`📊 Final stats: ${finalStats.rows[0].total_challenges} total challenges, ${finalStats.rows[0].unique_challenges} unique challenges`);

    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('❌ Error during challenge cleanup:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  cleanupDuplicateChallenges()
    .then(() => {
      console.log('🎉 Challenge cleanup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Challenge cleanup failed:', error);
      process.exit(1);
    });
}

export { cleanupDuplicateChallenges };