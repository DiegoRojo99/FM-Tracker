import { config } from 'dotenv';
import admin from 'firebase-admin';
import { Pool } from 'pg';

config();

export async function migrateSupplementaryCompetitions(firestore: admin.firestore.Firestore, pool: Pool) {
  console.log('🔧 Starting supplementary competitions migration for challenges...');

  try {
    // 1. Get competition IDs referenced in challenges
    console.log('📋 Getting competition IDs from challenges...');
    const challengesSnapshot = await firestore.collection('challenges').get();
    const challengeCompetitionIds = new Set<string>();
    
    challengesSnapshot.docs.forEach(doc => {
      const challenge = doc.data();
      challenge.goals?.forEach((goal: any) => {
        if (goal.competitionId) {
          challengeCompetitionIds.add(goal.competitionId);
        }
      });
    });

    console.log(`Found ${challengeCompetitionIds.size} competition IDs referenced in challenges`);

    // 2. Get currently migrated competition IDs
    const migratedCompetitions = await pool.query(`
      SELECT DISTINCT cgac."apiCompetitionId" as api_id
      FROM "CompetitionGroupApiCompetition" cgac
    `);
    const migratedCompetitionIds = new Set(migratedCompetitions.rows.map(row => String(row.api_id)));

    // 3. Find missing competitions that challenges need
    const missingCompetitionIds = Array.from(challengeCompetitionIds).filter(id => 
      !migratedCompetitionIds.has(id)
    );

    console.log(`Need to find ${missingCompetitionIds.length} missing competitions:`, missingCompetitionIds);

    if (missingCompetitionIds.length === 0) {
      console.log('✅ All challenge competitions already migrated');
      return { success: true, added: 0 };
    }

    // 4. Search for missing competitions in multiple locations
    console.log('🔍 Searching for missing competitions...');
    const foundCompetitions: any[] = [];

    // Search in apiCompetitions collection
    console.log('  📂 Checking apiCompetitions collection...');
    for (const competitionId of missingCompetitionIds) {
      try {
        const apiCompDoc = await firestore.collection('apiCompetitions').doc(competitionId).get();
        if (apiCompDoc.exists) {
          const data = apiCompDoc.data();
          if (data && data.inFootballManager === true) {
            foundCompetitions.push({
              id: competitionId,
              source: 'apiCompetitions',
              ...data
            });
            console.log(`    ✅ Found ID ${competitionId}: ${data.name} (inFootballManager: true)`);
          } else {
            console.log(`    ⚠️  Found ID ${competitionId}: ${data?.name} (inFootballManager: ${data?.inFootballManager})`);
          }
        }
      } catch (error) {
        console.log(`    ❌ Error checking competition ${competitionId}:`, error);
      }
    }

    // Search in countries/{countryCode}/competitions subcollections
    console.log('  🌍 Checking countries/{countryCode}/competitions subcollections...');
    const countriesSnapshot = await firestore.collection('countries').get();
    
    for (const countryDoc of countriesSnapshot.docs) {
      const countryCode = countryDoc.id;
      try {
        const competitionsSnapshot = await firestore
          .collection('countries')
          .doc(countryCode)
          .collection('competitions')
          .get();

        for (const compDoc of competitionsSnapshot.docs) {
          const competitionId = compDoc.id;
          if (missingCompetitionIds.includes(competitionId)) {
            const data = compDoc.data();
            if (data && data.inFootballManager === true) {
              foundCompetitions.push({
                id: competitionId,
                source: `countries/${countryCode}/competitions`,
                countryCode,
                ...data
              });
              console.log(`    ✅ Found ID ${competitionId}: ${data.name} in ${countryCode} (inFootballManager: true)`);
            }
          }
        }
      } catch (error) {
        // Skip countries that don't have competitions subcollection
        continue;
      }
    }

    console.log(`\n📊 Found ${foundCompetitions.length} FM-available competitions to migrate`);

    if (foundCompetitions.length === 0) {
      console.log('ℹ️  No FM-available competitions found for migration');
      return { success: true, added: 0 };
    }

    // 5. Get reference data for validation
    const countries = await pool.query('SELECT code FROM "Country"');
    const countryCodes = new Set(countries.rows.map(row => row.code));

    let addedCompetitions = 0;
    let addedJunctions = 0;

    // 6. Migrate found competitions
    console.log('\n🏗️  Migrating supplementary competitions...');
    
    for (const competition of foundCompetitions) {
      try {
        // Validate country code
        const countryCode = competition.countryCode || 'UNKNOWN';
        if (!countryCodes.has(countryCode)) {
          console.warn(`⚠️  Unknown country code ${countryCode} for competition ${competition.name}`);
          continue;
        }

        // Create competition group entry
        const insertGroupResult = await pool.query(`
          INSERT INTO "CompetitionGroup" (name, "displayName", "countryCode", type, "logoUrl", "isActive", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
          RETURNING id
        `, [
          competition.name,
          competition.name, // Use same name for display
          countryCode,
          competition.type || 'Unknown',
          competition.logo || null
        ]);

        const competitionGroupId = insertGroupResult.rows[0].id;
        addedCompetitions++;

        console.log(`  ✅ Added CompetitionGroup: ${competition.name} → ID ${competitionGroupId}`);

        // Create API competition entry if it doesn't exist
        const existingApi = await pool.query('SELECT id FROM "ApiCompetition" WHERE id = $1', [competition.id]);
        
        if (existingApi.rows.length === 0) {
          await pool.query(`
            INSERT INTO "ApiCompetition" (id, name, "countryCode", type, "logoUrl", tier, "isActive", "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
          `, [
            parseInt(competition.id),
            competition.name,
            countryCode,
            competition.type || 'Unknown',
            competition.logo || null,
            competition.tier || null
          ]);
          
          console.log(`  ✅ Added ApiCompetition: ${competition.name} → ID ${competition.id}`);
        }

        // Create junction table entry
        await pool.query(`
          INSERT INTO "CompetitionGroupApiCompetition" ("competitionGroupId", "apiCompetitionId", "createdAt")
          VALUES ($1, $2, NOW())
        `, [competitionGroupId, parseInt(competition.id)]);
        
        addedJunctions++;
        console.log(`  🔗 Linked CompetitionGroup ${competitionGroupId} ↔ ApiCompetition ${competition.id}`);

      } catch (error) {
        console.error(`❌ Failed to migrate competition ${competition.name}:`, error);
      }
    }

    console.log(`\n✅ Supplementary competition migration completed!`);
    console.log(`  Competition Groups added: ${addedCompetitions}`);
    console.log(`  Junction entries added: ${addedJunctions}`);

    return {
      success: true,
      added: addedCompetitions,
      foundCompetitions: foundCompetitions.length,
      details: foundCompetitions.map(c => ({ id: c.id, name: c.name, source: c.source }))
    };

  } catch (error) {
    console.error('❌ Supplementary competition migration failed:', error);
    throw error;
  }
}

if (require.main === module) {
  migrateSupplementaryCompetitions(db, pool)
    .then(result => {
      console.log('🎉 Supplementary competition migration completed!', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}