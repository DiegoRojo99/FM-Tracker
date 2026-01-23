export async function migrateGames(firestore: any, pool: any) {
  console.log('🎮 Fetching games from Firebase...');
  
  try {
    const gamesSnapshot = await firestore.collection('games').get();
    console.log(`📦 Found ${gamesSnapshot.size} games to migrate`);
    
    let migratedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const doc of gamesSnapshot.docs) {
      const data = doc.data();
      const firebaseId = doc.id; // Use Firebase document ID as the game ID
      const game = {
        ...data,
      };

      try {
        const releaseDate = game.releaseDate?.toDate?.() || new Date();
        const logoUrl = game.logoUrl || '/default-game-logo.png'; // Provide default value
        
        // Check if game already exists by ID (since we're using Firebase ID)
        const existingGame = await pool.query(`
          SELECT id FROM "Game" 
          WHERE id = $1
        `, [firebaseId]);

        if (existingGame.rows.length > 0) {
          // Update existing game
          await pool.query(`
            UPDATE "Game" SET
              name = $1,
              "shortName" = $2,
              version = $3,
              platform = $4,
              "logoUrl" = $5,
              "releaseDate" = $6,
              "updatedAt" = $7,
              "isActive" = $8,
              "sortOrder" = $9,
              variant = $10
            WHERE id = $11
          `, [
            game.name,
            game.shortName,
            game.version,
            game.platform,
            logoUrl,
            releaseDate,
            new Date(),
            game.isActive,
            game.sortOrder,
            game.variant || 'Standard',
            firebaseId
          ]);

          updatedCount++;
          console.log(`🔄 Updated game: ${game.name} (${firebaseId})`);
        } else {
          // Insert new game with Firebase ID
          await pool.query(`
            INSERT INTO "Game" (id, name, "shortName", version, platform, "logoUrl", "releaseDate", "isActive", "sortOrder", variant, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          `, [
            firebaseId, // Use Firebase document ID as primary key
            game.name,
            game.shortName,
            game.version,
            game.platform,
            logoUrl,
            releaseDate,
            game.isActive,
            game.sortOrder,
            game.variant || 'Standard',
            new Date(),
            new Date()
          ]);

          migratedCount++;
          console.log(`✅ Created game: ${game.name} (${firebaseId})`);
        }

      } catch (error: any) {
        errorCount++;
        console.error(`❌ Failed to migrate game ${firebaseId}:`, error.message);
      }
    }

    console.log(`   ✅ ${migratedCount} games created`);
    console.log(`   🔄 ${updatedCount} games updated`);
    if (errorCount > 0) {
      console.log(`   ❌ ${errorCount} errors`);
    }

    return { migratedCount, updatedCount, errorCount };

  } catch (error) {
    console.error('💥 Game migration failed:', error);
    throw error;
  }
}