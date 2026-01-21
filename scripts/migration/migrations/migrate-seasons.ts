export async function migrateSeasons(firestore: any, pool: any, specificUserId?: string) {
  console.log('📅 Fetching seasons from Firebase...');
  
  try {
    let totalSeasons = 0;
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
      console.log(`\n📂 Processing seasons for user: ${userId}`);
      
      // Get saves subcollection for this user
      const savesSnapshot = await userDoc.ref.collection('saves').get();
      console.log(`📦 Found ${savesSnapshot.size} saves for this user`);

      for (const saveDoc of savesSnapshot.docs) {
        const saveId = saveDoc.id;
        
        try {
          // Get seasons subcollection
          const seasonsSnapshot = await saveDoc.ref.collection('seasons').get();
          if (seasonsSnapshot.size === 0) continue;
          
          totalSeasons += seasonsSnapshot.size;
          console.log(`  📅 Save ${saveId}: ${seasonsSnapshot.size} seasons`);

          for (const seasonDoc of seasonsSnapshot.docs) {
            const seasonData = seasonDoc.data();
            
            try {
              // Verify save exists in PostgreSQL
              const saveExists = await pool.query('SELECT id FROM "Save" WHERE id = $1', [saveId]);
              if (saveExists.rows.length === 0) {
                console.warn(`⚠️  Save ${saveId} not found in PostgreSQL, skipping season`);
                skippedCount++;
                continue;
              }

              // Handle team ID (convert string to integer)
              let teamId = null;
              if (seasonData.teamId) {
                teamId = parseInt(seasonData.teamId);
                // Verify team exists
                const teamExists = await pool.query('SELECT id FROM "Team" WHERE id = $1', [teamId]);
                if (teamExists.rows.length === 0) {
                  console.warn(`⚠️  Team ${teamId} not found for season, skipping`);
                  skippedCount++;
                  continue;
                }
              } else {
                console.warn(`⚠️  No teamId for season, skipping`);
                skippedCount++;
                continue;
              }

              // Handle timestamps
              let createdAt = new Date();
              if (seasonData.createdAt) {
                if (typeof seasonData.createdAt === 'string') {
                  createdAt = new Date(seasonData.createdAt);
                } else if (seasonData.createdAt._seconds) {
                  createdAt = new Date(seasonData.createdAt._seconds * 1000);
                }
              }

              // Prepare season object
              const season = {
                saveId: saveId,
                season: seasonData.season || '2024/25',
                teamId: teamId,
                createdAt: createdAt,
                updatedAt: new Date()
              };

              // Check if season already exists (based on saveId, teamId, and season)
              const existingSeason = await pool.query(`
                SELECT id FROM "Season" 
                WHERE "saveId" = $1 AND "teamId" = $2 AND season = $3
              `, [season.saveId, season.teamId, season.season]);

              if (existingSeason.rows.length > 0) {
                // Update existing season
                await pool.query(`
                  UPDATE "Season" SET
                    "updatedAt" = $1
                  WHERE "saveId" = $2 AND "teamId" = $3 AND season = $4
                `, [
                  season.updatedAt,
                  season.saveId,
                  season.teamId,
                  season.season
                ]);

                updatedCount++;
                console.log(`🔄 Updated season: ${seasonData.teamName} ${season.season}`);
              } else {
                // Insert new season
                const result = await pool.query(`
                  INSERT INTO "Season" ("saveId", season, "teamId", "createdAt", "updatedAt")
                  VALUES ($1, $2, $3, $4, $5)
                  RETURNING id
                `, [
                  season.saveId,
                  season.season,
                  season.teamId,
                  season.createdAt,
                  season.updatedAt
                ]);

                migratedCount++;
                const seasonId = result.rows[0].id;
                console.log(`✅ Created season: ${seasonData.teamName} ${season.season} (ID: ${seasonId})`);
                
                // Note: Skipping cup results and league results for now
                // TODO: Migrate these once CompetitionGroup is migrated
                if (seasonData.cupResults && seasonData.cupResults.length > 0) {
                  console.log(`     📝 Note: ${seasonData.cupResults.length} cup results will be migrated later`);
                }
                if (seasonData.leagueResult) {
                  console.log(`     📝 Note: League result (pos: ${seasonData.leagueResult.position}) will be migrated later`);
                }
              }

            } catch (error: any) {
              errorCount++;
              console.error(`❌ Failed to migrate season for save ${saveId}: ${error.message}`);
            }
          }
        } catch (error: any) {
          console.error(`❌ Failed to process seasons for save ${saveId}: ${error.message}`);
        }
      }
    }

    console.log(`\n📊 Seasons Migration Results:`);
    console.log(`   📦 ${totalSeasons} seasons processed`);
    console.log(`   ✅ ${migratedCount} seasons created`);
    console.log(`   🔄 ${updatedCount} seasons updated`);
    if (skippedCount > 0) {
      console.log(`   ⚠️  ${skippedCount} seasons skipped`);
    }
    if (errorCount > 0) {
      console.log(`   ❌ ${errorCount} errors`);
    }
    
    if (migratedCount > 0 || updatedCount > 0) {
      console.log(`\n📝 Note: Cup results and league results will be migrated after CompetitionGroup migration`);
    }

    return { migratedCount, updatedCount, errorCount, skippedCount };

  } catch (error) {
    console.error('💥 Seasons migration failed:', error);
    throw error;
  }
}