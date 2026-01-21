import { config } from 'dotenv';
import pkg from 'pg';

config();

const { Pool } = pkg;

async function verifyCompetitionMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Verifying competition migration results...\n');

    // Check table counts
    const apiCompetitionCount = await pool.query('SELECT COUNT(*) FROM "ApiCompetition"');
    const competitionGroupCount = await pool.query('SELECT COUNT(*) FROM "CompetitionGroup"');
    const junctionCount = await pool.query('SELECT COUNT(*) FROM "CompetitionGroupApiCompetition"');

    console.log('📊 Migration Results:');
    console.log(`   ApiCompetition: ${apiCompetitionCount.rows[0].count} records`);
    console.log(`   CompetitionGroup: ${competitionGroupCount.rows[0].count} records`);
    console.log(`   Junction entries: ${junctionCount.rows[0].count} records`);

    // Check grouping examples
    console.log('\n🔍 Grouping Examples:');
    const groupingExamples = await pool.query(`
      SELECT cg.name, cg."countryCode", cg.type, COUNT(cgac.id) as api_competition_count
      FROM "CompetitionGroup" cg
      LEFT JOIN "CompetitionGroupApiCompetition" cgac ON cg.id = cgac."competitionGroupId"
      GROUP BY cg.id, cg.name, cg."countryCode", cg.type
      HAVING COUNT(cgac.id) > 1
      ORDER BY COUNT(cgac.id) DESC, cg.name
      LIMIT 10
    `);

    for (const group of groupingExamples.rows) {
      console.log(`   ${group.countryCode}-${group.name} (${group.type}): ${group.api_competition_count} competitions`);
    }

    // Check tier distribution
    console.log('\n📊 Tier Distribution:');
    const tierDistribution = await pool.query(`
      SELECT tier, COUNT(*) as count
      FROM "CompetitionGroup"
      WHERE tier IS NOT NULL
      GROUP BY tier
      ORDER BY tier
    `);

    for (const tier of tierDistribution.rows) {
      console.log(`   Tier ${tier.tier}: ${tier.count} groups`);
    }

    // Verify data integrity
    console.log('\n✅ Data Integrity Checks:');
    
    // Check for orphaned junctions
    const orphanedGroups = await pool.query(`
      SELECT COUNT(*)
      FROM "CompetitionGroupApiCompetition" cgac
      LEFT JOIN "CompetitionGroup" cg ON cgac."competitionGroupId" = cg.id
      WHERE cg.id IS NULL
    `);

    const orphanedApi = await pool.query(`
      SELECT COUNT(*)
      FROM "CompetitionGroupApiCompetition" cgac
      LEFT JOIN "ApiCompetition" ac ON cgac."apiCompetitionId" = ac.id
      WHERE ac.id IS NULL
    `);

    console.log(`   Orphaned group references: ${orphanedGroups.rows[0].count}`);
    console.log(`   Orphaned API references: ${orphanedApi.rows[0].count}`);

    // Check country code consistency
    const countryMismatches = await pool.query(`
      SELECT COUNT(*)
      FROM "CompetitionGroupApiCompetition" cgac
      JOIN "CompetitionGroup" cg ON cgac."competitionGroupId" = cg.id
      JOIN "ApiCompetition" ac ON cgac."apiCompetitionId" = ac.id
      WHERE cg."countryCode" != ac."countryCode"
    `);

    console.log(`   Country code mismatches: ${countryMismatches.rows[0].count}`);

    console.log('\n🎉 Competition migration verification complete!');

  } catch (error) {
    console.error('Error verifying migration:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

verifyCompetitionMigration();