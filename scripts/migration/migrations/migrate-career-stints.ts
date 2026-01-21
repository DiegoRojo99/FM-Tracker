export async function migrateCareerStints(firestore: any, pool: any, specificUserId?: string) {
  console.log('👔 Fetching career stints from Firebase...');
  
  try {
    let totalStints = 0;
    let migratedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // Get users (filter to specific user if provided)
    let usersQuery = firestore.collection('users');
    if (specificUserId) {
      usersQuery = usersQuery.where('__name__', '==', specificUserId);
      console.log(`🔍 Focusing on user: ${specificUserId}`);
    }
    
    const usersSnapshot = await usersQuery.get();
    console.log(`👥 Found ${usersSnapshot.size} users to process`);

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`\n📂 Processing career stints for user: ${userId}`);
      
      // Get saves subcollection for this user
      const savesSnapshot = await userDoc.ref.collection('saves').get();
      console.log(`📦 Found ${savesSnapshot.size} saves for this user`);

      for (const saveDoc of savesSnapshot.docs) {
        const saveId = saveDoc.id;
        
        try {
          // Get career subcollection (this is the stints data)
          const careerSnapshot = await saveDoc.ref.collection('career').get();
          if (careerSnapshot.size === 0) continue;
          
          totalStints += careerSnapshot.size;
          console.log(`  📝 Save ${saveId}: ${careerSnapshot.size} career stints`);

          for (const careerDoc of careerSnapshot.docs) {
            const careerData = careerDoc.data();
            
            try {
              // Verify save exists in PostgreSQL
              const saveExists = await pool.query('SELECT id FROM "Save" WHERE id = $1', [saveId]);
              if (saveExists.rows.length === 0) {
                console.warn(`⚠️  Save ${saveId} not found in PostgreSQL, skipping stint`);
                skippedCount++;
                continue;
              }

              // Handle team ID (convert string to integer)
              let teamId = null;
              if (careerData.teamId) {
                teamId = parseInt(careerData.teamId);
                // Verify team exists
                const teamExists = await pool.query('SELECT id FROM "Team" WHERE id = $1', [teamId]);
                if (teamExists.rows.length === 0) {
                  console.warn(`⚠️  Team ${teamId} not found for stint, skipping`);
                  skippedCount++;
                  continue;
                }
              } else {
                console.warn(`⚠️  No teamId for stint, skipping`);
                skippedCount++;
                continue;
              }

              // Handle timestamps
              let createdAt = new Date();
              if (careerData.createdAt) {
                if (typeof careerData.createdAt === 'string') {
                  createdAt = new Date(careerData.createdAt);
                } else if (careerData.createdAt._seconds) {
                  createdAt = new Date(careerData.createdAt._seconds * 1000);
                }
              }

              // Prepare career stint object
              const stint = {
                saveId: saveId,
                teamId: teamId,
                startDate: careerData.startDate || '2024-01-01',
                endDate: careerData.endDate || null,
                isNational: careerData.isNational || false,
                createdAt: createdAt,
                updatedAt: new Date()
              };

              // Check if stint already exists (based on saveId, teamId, and startDate)
              const existingStint = await pool.query(`
                SELECT id FROM "CareerStint" 
                WHERE "saveId" = $1 AND "teamId" = $2 AND "startDate" = $3
              `, [stint.saveId, stint.teamId, stint.startDate]);

              if (existingStint.rows.length > 0) {
                // Update existing stint
                await pool.query(`
                  UPDATE "CareerStint" SET
                    "endDate" = $1,
                    "isNational" = $2,
                    "updatedAt" = $3
                  WHERE "saveId" = $4 AND "teamId" = $5 AND "startDate" = $6
                `, [
                  stint.endDate,
                  stint.isNational,
                  stint.updatedAt,
                  stint.saveId,
                  stint.teamId,
                  stint.startDate
                ]);

                updatedCount++;
                console.log(`🔄 Updated stint: ${careerData.teamName} (${stint.startDate} - ${stint.endDate || 'ongoing'})`);
              } else {
                // Insert new stint
                await pool.query(`
                  INSERT INTO "CareerStint" ("saveId", "teamId", "startDate", "endDate", "isNational", "createdAt", "updatedAt")
                  VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [
                  stint.saveId,
                  stint.teamId,
                  stint.startDate,
                  stint.endDate,
                  stint.isNational,
                  stint.createdAt,
                  stint.updatedAt
                ]);

                migratedCount++;
                console.log(`✅ Created stint: ${careerData.teamName} (${stint.startDate} - ${stint.endDate || 'ongoing'})`);
              }

            } catch (error: any) {
              errorCount++;
              console.error(`❌ Failed to migrate stint for save ${saveId}: ${error.message}`);
            }
          }
        } catch (error: any) {
          console.error(`❌ Failed to process save ${saveId}: ${error.message}`);
        }
      }
    }

    console.log(`\n📊 Career Stints Migration Results:`);
    console.log(`   📦 ${totalStints} stints processed`);
    console.log(`   ✅ ${migratedCount} stints created`);
    console.log(`   🔄 ${updatedCount} stints updated`);
    if (skippedCount > 0) {
      console.log(`   ⚠️  ${skippedCount} stints skipped`);
    }
    if (errorCount > 0) {
      console.log(`   ❌ ${errorCount} errors`);
    }

    return { migratedCount, updatedCount, errorCount, skippedCount };

  } catch (error) {
    console.error('💥 Career stints migration failed:', error);
    throw error;
  }
}