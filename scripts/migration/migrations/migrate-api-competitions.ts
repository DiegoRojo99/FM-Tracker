import { Pool } from 'pg';
import admin from 'firebase-admin';
import type { FirestoreApiCompetition } from '../../../src/lib/types/Competition-Migration';

export async function migrateApiCompetitions(firestore: any, pool: Pool): Promise<void> {
  console.log('\n🏆 Starting ApiCompetition migration...');
  
  try {
    // Fetch all apiCompetitions from Firestore
    console.log('📥 Fetching apiCompetitions from Firestore...');
    const snapshot = await firestore.collection('apiCompetitions').get();
    const competitions: FirestoreApiCompetition[] = snapshot.docs.map((doc: any) => ({
      id: parseInt(doc.id), // Convert string document ID to number
      ...doc.data()
    }));

    console.log(`Found ${competitions.length} API competitions to migrate`);

    if (competitions.length === 0) {
      console.log('⏭️  No API competitions found, skipping migration');
      return;
    }

    // Check how many already exist in PostgreSQL
    const existingCheck = await pool.query(
      'SELECT id FROM "ApiCompetition" ORDER BY id'
    );
    const existingIds = new Set(existingCheck.rows.map(row => row.id));
    const newCompetitions = competitions.filter(comp => !existingIds.has(comp.id));

    if (newCompetitions.length === 0) {
      console.log(`✅ All ${competitions.length} API competitions already migrated`);
      return;
    }

    console.log(`📝 Migrating ${newCompetitions.length} new API competitions (${existingIds.size} already exist)`);

    let successful = 0;
    let failed = 0;

    for (const competition of newCompetitions) {
      try {
        // Validate required fields
        if (!competition.name || !competition.countryCode || !competition.type) {
          console.log(`⚠️  Skipping API competition ${competition.id}: missing required fields`);
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

        // Convert Firestore timestamp to Date if needed
        let createdAt = new Date();
        let updatedAt = new Date();

        if (competition.createdAt) {
          if (competition.createdAt instanceof admin.firestore.Timestamp) {
            createdAt = competition.createdAt.toDate();
          } 
          else if (typeof competition.createdAt === 'object' && '_seconds' in competition.createdAt) {
            createdAt = new Date(competition.createdAt._seconds * 1000);
          }
        }

        if (competition.lastUpdated) {
          if (competition.lastUpdated instanceof admin.firestore.Timestamp) {
            updatedAt = competition.lastUpdated.toDate();
          } else if (typeof competition.lastUpdated === 'object' && '_seconds' in competition.lastUpdated) {
            updatedAt = new Date(competition.lastUpdated._seconds * 1000);
          }
        }

        // Insert the API competition
        await pool.query(`
          INSERT INTO "ApiCompetition" (
            id, name, "countryCode", type, "logoUrl", tier, "isActive", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          competition.id,
          competition.name,
          competition.countryCode,
          competition.type,
          competition.logo || null, // logo -> logoUrl
          null, // tier will be set later from admin data
          competition.inFootballManager || true, // inFootballManager -> isActive
          createdAt,
          updatedAt
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