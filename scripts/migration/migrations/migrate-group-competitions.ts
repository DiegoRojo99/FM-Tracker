import { Pool } from 'pg';
import type { ApiCompetition, CompetitionGroup } from '../../../src/lib/types/prisma/Competitions';

export async function migrateGroupCompetitions(firestore: any, pool: Pool): Promise<void> {
  console.log('\n🏆 Starting GroupCompetition migration...');
  
  try {
    // Fetch all groupCompetitions from PostgreSQL
    console.log('📥 Fetching groupCompetitions from PostgreSQL...');
    const apiCompetitions = await pool.query(`
      SELECT id, name, "countryCode", type, "logoUrl", tier, "isActive", "createdAt", "updatedAt"
      FROM "ApiCompetition"
      ORDER BY id
    `);

    const competitions: ApiCompetition[] = apiCompetitions.rows.map((row: any) => ({
      name: row.name,
      id: Number(row.id),
      countryCode: row.countryCode,
      type: row.type,
      logoUrl: row.logoUrl,
      tier: row.tier,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    console.log(`Found ${competitions.length} API competitions to migrate`);
    if (competitions.length === 0) {
      console.log('⏭️  No API competitions found, skipping migration');
      return;
    }

    // Check how many already link to a competition group in PostgreSQL
    const existingCheck = await pool.query(
      'SELECT "apiCompetitionId" FROM "CompetitionGroupApiCompetition" ORDER BY id'
    );
    const existingIds = new Set(existingCheck.rows.map(row => row.apiCompetitionId));
    const newCompetitions = competitions.filter(comp => !existingIds.has(comp.id));

    if (newCompetitions.length === 0) {
      console.log(`✅ All ${competitions.length} API competitions already migrated`);
      return;
    }

    console.log(`📝 Migrating ${newCompetitions.length} new API competitions (${existingIds.size} already exist)`);

    let successful = 0;
    let failed = 0;

    // Check how many already have a competition group in PostgreSQL
    const groupExistingCheck = await pool.query(
      'SELECT "name", "countryCode" FROM "CompetitionGroup"'
    );
    const existingGroups = new Set(groupExistingCheck.rows.map((row: any) => `${row.name}||${row.countryCode}`));

    for (const competition of newCompetitions) {
      try {
        // Validate required fields
        if (!competition.name || !competition.countryCode || !competition.type) {
          console.log(`⚠️  Skipping API competition ${competition.id}: missing required fields`);
          failed++;
          continue;
        }

        // Check if CompetitionGroup already exists to avoid duplicates
        const groupKey = `${competition.name}||${competition.countryCode}`;
        if (existingGroups.has(groupKey)) {
          console.log(`⚠️  Skipping API competition ${competition.id} (${competition.name}): CompetitionGroup already exists`);
          failed++;
          continue;
        }

        // Check if country exists
        const countryCheck = await pool.query(
          'SELECT code FROM "Country" WHERE code = $1',
          [competition.countryCode]
        );

        if (countryCheck.rows.length === 0) {
          console.log(`⚠️  Skipping API competition ${competition.id} (${competition.name}): country ${competition.countryCode} not found`);
          failed++;
          continue;
        }

        // Insert the API competition into PostgreSQL as CompetitionGroup
        const createdAt = competition.createdAt || new Date();
        const updatedAt = competition.updatedAt || new Date();
        await pool.query(`
          INSERT INTO "CompetitionGroup" (
            name, "countryCode", type, "logoUrl", tier, "isActive", "createdAt", "updatedAt", "displayName"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          competition.name,
          competition.countryCode,
          competition.type,
          competition.logoUrl,
          null, // tier will be set later from admin data
          competition.isActive,
          createdAt,
          updatedAt,
          competition.name, // displayName
        ]);

        successful++;
        
        if (successful % 10 === 0) {
          console.log(`📝 Migrated ${successful} API competitions...`);
        }

      } catch (error) {
        console.error(`❌ Error migrating API competition ${competition.id} (${competition.name}):`, error);
        failed++;
      }
    }

    // Final summary
    console.log(`\n✅ ApiCompetition migration completed!`);
    console.log(`   📊 Successfully migrated: ${successful}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📈 Total in database: ${existingIds.size + successful}`);

    if (failed > 0) {
      console.log(`⚠️  ${failed} competitions failed to migrate - check logs above`);
    }

  } catch (error) {
    console.error('❌ Fatal error in ApiCompetition migration:', error);
    throw error;
  }
}