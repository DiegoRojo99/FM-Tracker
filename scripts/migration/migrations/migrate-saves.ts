export async function migrateSaves(firestore: any, pool: any, specificUserId?: string) {
  console.log('💾 Fetching saves from Firebase...');
  
  try {
    // Get actual game IDs from PostgreSQL database
    const gamesResult = await pool.query('SELECT id, "shortName" FROM "Game" ORDER BY id');
    const gameIdMapping: { [key: string]: number } = {};
    
    console.log('🎮 Available games in PostgreSQL:');
    for (const game of gamesResult.rows) {
      // Create mapping for both formats (original and lowercase)
      gameIdMapping[game.shortName] = game.id;
      gameIdMapping[game.shortName.toLowerCase()] = game.id;
      console.log(`   ${game.shortName} -> ${game.id}`);
    }
    
    // Additional manual mappings for Firebase format
    gameIdMapping['fm24'] = gameIdMapping['FM24'] || gameIdMapping['fm24'];
    gameIdMapping['fm26'] = gameIdMapping['FM26'] || gameIdMapping['fm26'];

    let totalSaves = 0;
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
      console.log(`\n📂 Processing saves for user: ${userId}`);
      
      // Get saves subcollection for this user
      const savesSnapshot = await userDoc.ref.collection('saves').get();
      console.log(`📦 Found ${savesSnapshot.size} saves for this user`);
      totalSaves += savesSnapshot.size;

      for (const saveDoc of savesSnapshot.docs) {
        const saveData = saveDoc.data();
        const saveId = saveDoc.id;
        
        try {
          // Map and validate game ID
          const firebaseGameId = saveData.gameId;
          const gameId = gameIdMapping[firebaseGameId];
          if (!gameId) {
            console.error(`❌ Unknown game ID: ${firebaseGameId} for save ${saveId}`);
            errorCount++;
            continue;
          }

          // Verify user exists in PostgreSQL
          const userExists = await pool.query('SELECT uid FROM "User" WHERE uid = $1', [userId]);
          if (userExists.rows.length === 0) {
            console.error(`❌ User ${userId} not found in PostgreSQL for save ${saveId}`);
            errorCount++;
            continue;
          }

          // Handle current club ID (convert string to integer)
          let currentClubId = null;
          if (saveData.currentClub?.id) {
            currentClubId = parseInt(saveData.currentClub.id);
            // Verify team exists
            const teamExists = await pool.query('SELECT id FROM "Team" WHERE id = $1', [currentClubId]);
            if (teamExists.rows.length === 0) {
              console.warn(`⚠️  Team ${currentClubId} not found for save ${saveId}, setting to null`);
              currentClubId = null;
            }
          }

          // Handle current NT ID (convert string to integer) 
          let currentNTId = null;
          if (saveData.currentNT?.id) {
            currentNTId = parseInt(saveData.currentNT.id);
            // Verify team exists
            const teamExists = await pool.query('SELECT id FROM "Team" WHERE id = $1', [currentNTId]);
            if (teamExists.rows.length === 0) {
              console.warn(`⚠️  National team ${currentNTId} not found for save ${saveId}, setting to null`);
              currentNTId = null;
            }
          }

          // Handle current league ID (convert string to integer and validate)
          let currentLeagueId = null;
          if (saveData.currentLeague?.id) {
            const leagueApiId = parseInt(saveData.currentLeague.id);
            
            // Find the CompetitionGroup that contains this API competition
            const competitionGroupQuery = await pool.query(`
              SELECT cg.id 
              FROM "CompetitionGroup" cg
              JOIN "CompetitionGroupApiCompetition" cgac ON cg.id = cgac."competitionGroupId"
              WHERE cgac."apiCompetitionId" = $1
              LIMIT 1
            `, [leagueApiId]);

            if (competitionGroupQuery.rows.length > 0) {
              currentLeagueId = competitionGroupQuery.rows[0].id;
              console.log(`🔗 Linked save to competition group ${currentLeagueId} (API competition ${leagueApiId})`);
            } else {
              console.log(`⚠️  Save references unknown competition ${leagueApiId} - setting currentLeagueId to null`);
            }
          }

          // Handle timestamps - support both string and Firebase timestamp formats
          let createdAt = new Date();
          let updatedAt = new Date();
          
          if (saveData.createdAt) {
            if (typeof saveData.createdAt === 'string') {
              createdAt = new Date(saveData.createdAt);
            } else if (saveData.createdAt._seconds) {
              createdAt = new Date(saveData.createdAt._seconds * 1000);
            }
          }
          
          if (saveData.updatedAt) {
            if (typeof saveData.updatedAt === 'string') {
              updatedAt = new Date(saveData.updatedAt);
            } else if (saveData.updatedAt._seconds) {
              updatedAt = new Date(saveData.updatedAt._seconds * 1000);
            }
          }

          // Prepare save object
          const save = {
            id: saveId,
            userId: userId,
            gameId: gameId,
            countryCode: saveData.countryCode || null,
            currentClubId: currentClubId,
            currentNTId: currentNTId,
            currentLeagueId: currentLeagueId,
            season: saveData.season || '2024/25',
            createdAt: createdAt,
            updatedAt: updatedAt
          };

          // Upsert save using raw SQL
          const result = await pool.query(`
            INSERT INTO "Save" (id, "userId", "gameId", "countryCode", "currentClubId", "currentNTId", "currentLeagueId", season, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (id) DO UPDATE SET
              "userId" = EXCLUDED."userId",
              "gameId" = EXCLUDED."gameId",
              "countryCode" = EXCLUDED."countryCode",
              "currentClubId" = EXCLUDED."currentClubId",
              "currentNTId" = EXCLUDED."currentNTId", 
              "currentLeagueId" = EXCLUDED."currentLeagueId",
              season = EXCLUDED.season,
              "updatedAt" = EXCLUDED."updatedAt"
            RETURNING (xmax = 0) as is_insert;
          `, [
            save.id,
            save.userId,
            save.gameId,
            save.countryCode,
            save.currentClubId,
            save.currentNTId,
            save.currentLeagueId,
            save.season,
            save.createdAt,
            save.updatedAt
          ]);

          const isInsert = result.rows[0]?.is_insert;
          if (isInsert) {
            migratedCount++;
            console.log(`✅ Created save: ${saveId} (Game: ${firebaseGameId}, Season: ${save.season})`);
          } else {
            updatedCount++;
            console.log(`🔄 Updated save: ${saveId} (Game: ${firebaseGameId}, Season: ${save.season})`);
          }

        } catch (error: any) {
          errorCount++;
          console.error(`❌ Failed to migrate save ${saveId}: ${error.message}`);
        }
      }
    }

    console.log(`\n📊 Saves Migration Results:`);
    console.log(`   📦 ${totalSaves} saves processed`);
    console.log(`   ✅ ${migratedCount} saves created`);
    console.log(`   🔄 ${updatedCount} saves updated`);
    if (skippedCount > 0) {
      console.log(`   ⚠️  ${skippedCount} saves skipped`);
    }
    if (errorCount > 0) {
      console.log(`   ❌ ${errorCount} errors`);
    }

    return { migratedCount, updatedCount, errorCount, skippedCount };

  } catch (error) {
    console.error('💥 Saves migration failed:', error);
    throw error;
  }
}