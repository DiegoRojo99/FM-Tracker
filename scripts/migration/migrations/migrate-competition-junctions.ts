import { Pool } from 'pg';
import admin from 'firebase-admin';
import type { FirestoreAdminCompetition } from '../../src/lib/types/Competition-Migration';

interface CompetitionMapping {
  adminCompetitionId: string;
  apiCompetitionId: number;
  competitionGroupId: number | null;
  competitionGroupName: string;
  countryCode: string;
  type: string;
}

export async function migrateCompetitionJunctions(firestore: any, pool: Pool): Promise<void> {
  console.log('\n🔗 Starting CompetitionGroupApiCompetition junction migration...');
  
  try {
    // Fetch all adminCompetitions from Firestore
    console.log('📥 Fetching adminCompetitions for junction mapping...');
    const snapshot = await firestore.collection('adminCompetitions').get();
    const adminCompetitions: FirestoreAdminCompetition[] = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Found ${adminCompetitions.length} admin competitions to map`);

    if (adminCompetitions.length === 0) {
      console.log('⏭️  No admin competitions found, skipping junction migration');
      return;
    }

    // Get all CompetitionGroups to build mapping
    console.log('📥 Fetching CompetitionGroups from PostgreSQL...');
    const groupsResult = await pool.query(`
      SELECT id, name, "countryCode", type
      FROM "CompetitionGroup"
      ORDER BY id
    `);

    const competitionGroups = new Map<string, number>();
    for (const group of groupsResult.rows) {
      const key = `${group.countryCode}-${group.name}-${group.type}`;
      competitionGroups.set(key, group.id);
    }

    console.log(`Found ${competitionGroups.size} competition groups in PostgreSQL`);

    // Build mapping data
    console.log('🔄 Building competition mappings...');
    const mappings: CompetitionMapping[] = [];
    let missingGroups = 0;

    for (const competition of adminCompetitions) {
      // Determine the group key (same logic as in migrate-competition-groups)
      let groupKey: string;
      let groupName: string;

      if (competition.isGrouped && competition.groupName) {
        groupKey = `${competition.countryCode}-${competition.groupName}-${competition.type}`;
        groupName = competition.groupName;
      } else {
        groupKey = `${competition.countryCode}-${competition.name}-${competition.type}`;
        groupName = competition.name;
      }

      const competitionGroupId = competitionGroups.get(groupKey);
      
      if (!competitionGroupId) {
        console.log(`⚠️  Missing CompetitionGroup for: ${groupKey}`);
        missingGroups++;
      }

      mappings.push({
        adminCompetitionId: competition.id,
        apiCompetitionId: competition.apiCompetitionId,
        competitionGroupId: competitionGroupId || null,
        competitionGroupName: groupName,
        countryCode: competition.countryCode,
        type: competition.type
      });
    }

    if (missingGroups > 0) {
      console.log(`⚠️  Found ${missingGroups} competitions without matching CompetitionGroups`);
      console.log('   This might indicate CompetitionGroup migration needs to run first');
    }

    // Filter out mappings without valid group IDs
    const validMappings = mappings.filter(m => m.competitionGroupId !== null);
    console.log(`📝 Creating ${validMappings.length} junction entries (${missingGroups} skipped)`);

    // Check existing junctions to avoid duplicates
    const existingCheck = await pool.query(`
      SELECT "competitionGroupId", "apiCompetitionId" 
      FROM "CompetitionGroupApiCompetition"
    `);
    const existingJunctions = new Set(
      existingCheck.rows.map(row => `${row.competitionGroupId}-${row.apiCompetitionId}`)
    );

    const newMappings = validMappings.filter(mapping => 
      !existingJunctions.has(`${mapping.competitionGroupId}-${mapping.apiCompetitionId}`)
    );

    if (newMappings.length === 0) {
      console.log(`✅ All ${validMappings.length} junction entries already exist`);
      return;
    }

    console.log(`📝 Creating ${newMappings.length} new junction entries (${existingJunctions.size} already exist)`);

    let successful = 0;
    let failed = 0;

    for (const mapping of newMappings) {
      try {
        // Verify ApiCompetition exists
        const apiCompetitionCheck = await pool.query(
          'SELECT id FROM "ApiCompetition" WHERE id = $1',
          [mapping.apiCompetitionId]
        );

        if (apiCompetitionCheck.rows.length === 0) {
          console.log(`⚠️  Skipping junction: ApiCompetition ${mapping.apiCompetitionId} not found`);
          failed++;
          continue;
        }

        // Insert junction entry
        await pool.query(`
          INSERT INTO "CompetitionGroupApiCompetition" (
            "competitionGroupId", "apiCompetitionId", "createdAt"
          ) VALUES ($1, $2, NOW())
        `, [
          mapping.competitionGroupId,
          mapping.apiCompetitionId
        ]);

        successful++;
        
        if (successful % 20 === 0) {
          console.log(`📝 Created ${successful} junction entries...`);
        }

      } catch (error) {
        console.error(`❌ Error creating junction for group ${mapping.competitionGroupId} <-> API ${mapping.apiCompetitionId}:`, error);
        failed++;
      }
    }

    // Final summary
    console.log(`\n✅ CompetitionGroupApiCompetition migration completed!`);
    console.log(`   📊 Successfully created: ${successful}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ⏭️  Skipped (missing groups): ${missingGroups}`);
    console.log(`   📈 Total junctions in database: ${existingJunctions.size + successful}`);

    if (failed > 0) {
      console.log(`⚠️  ${failed} junction entries failed to create - check logs above`);
    }

    if (missingGroups > 0) {
      console.log(`⚠️  ${missingGroups} competitions couldn't be mapped - run CompetitionGroup migration first`);
    }

    // Verify the junction integrity
    await verifyJunctionIntegrity(pool);

  } catch (error) {
    console.error('❌ Fatal error in CompetitionGroupApiCompetition migration:', error);
    throw error;
  }
}

async function verifyJunctionIntegrity(pool: Pool): Promise<void> {
  console.log('\n🔍 Verifying junction table integrity...');
  
  try {
    // Check for orphaned junction entries
    const orphanedGroupCheck = await pool.query(`
      SELECT cgac."competitionGroupId", cgac."apiCompetitionId"
      FROM "CompetitionGroupApiCompetition" cgac
      LEFT JOIN "CompetitionGroup" cg ON cgac."competitionGroupId" = cg.id
      WHERE cg.id IS NULL
      LIMIT 5
    `);

    const orphanedApiCheck = await pool.query(`
      SELECT cgac."competitionGroupId", cgac."apiCompetitionId"
      FROM "CompetitionGroupApiCompetition" cgac
      LEFT JOIN "ApiCompetition" ac ON cgac."apiCompetitionId" = ac.id
      WHERE ac.id IS NULL
      LIMIT 5
    `);

    if (orphanedGroupCheck.rows.length > 0) {
      console.log(`⚠️  Found ${orphanedGroupCheck.rows.length} junction entries with missing CompetitionGroups`);
    }

    if (orphanedApiCheck.rows.length > 0) {
      console.log(`⚠️  Found ${orphanedApiCheck.rows.length} junction entries with missing ApiCompetitions`);
    }

    // Summary statistics
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_junctions,
        COUNT(DISTINCT "competitionGroupId") as unique_groups,
        COUNT(DISTINCT "apiCompetitionId") as unique_api_competitions
      FROM "CompetitionGroupApiCompetition"
    `);

    const stats = statsResult.rows[0];
    console.log(`📊 Junction table statistics:`);
    console.log(`   Total junction entries: ${stats.total_junctions}`);
    console.log(`   Unique groups: ${stats.unique_groups}`);
    console.log(`   Unique API competitions: ${stats.unique_api_competitions}`);

    if (orphanedGroupCheck.rows.length === 0 && orphanedApiCheck.rows.length === 0) {
      console.log(`✅ Junction table integrity verified - all references are valid`);
    }

  } catch (error) {
    console.error('❌ Error verifying junction integrity:', error);
  }
}