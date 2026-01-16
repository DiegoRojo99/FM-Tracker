import { Game } from '../../../src/lib/types/Game.d';

export async function migrateGames(firestore: any, pool: any) {
  console.log('🎮 Fetching games from Firebase...');
  
  try {
    const gamesSnapshot = await firestore.collection('games').get();
    console.log(`📦 Found ${gamesSnapshot.size} games to migrate`);
    
    let migratedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const doc of gamesSnapshot.docs) {
      const data = doc.data() as Omit<Game, 'id'>;
      const firebaseId = doc.id; // Store the original Firebase ID for reference
      const game = {
        ...data,
      };

      try {
        const releaseDate = game.releaseDate?.toDate?.() || new Date();
        const logoUrl = game.logoUrl || '/default-game-logo.png'; // Provide default value
        
        // Check if game already exists based on unique combination of name and version
        const existingGame = await pool.query(`
          SELECT id FROM "Game" 
          WHERE name = $1 AND version = $2 AND platform = $3
        `, [game.name, game.version, game.platform]);

        if (existingGame.rows.length > 0) {
          // Update existing game
          const result = await pool.query(`
            UPDATE "Game" SET
              "shortName" = $1,
              "logoUrl" = $2,
              "releaseDate" = $3,
              "updatedAt" = $4,
              "isActive" = $5,
              "sortOrder" = $6,
              variant = $7
            WHERE name = $8 AND version = $9 AND platform = $10
            RETURNING id;
          `, [
            game.shortName,
            logoUrl,
            releaseDate,
            new Date(),
            game.isActive,
            game.sortOrder,
            game.variant || null,
            game.name,
            game.version,
            game.platform
          ]);

          updatedCount++;
          console.log(`🔄 Updated game: ${game.name} (Firebase ID: ${firebaseId})`);
        } else {
          // Insert new game
          const result = await pool.query(`
            INSERT INTO "Game" (name, "shortName", version, platform, "logoUrl", "releaseDate", "isActive", "sortOrder", variant, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id;
          `, [
            game.name,
            game.shortName,
            game.version,
            game.platform,
            logoUrl,
            releaseDate,
            game.isActive,
            game.sortOrder,
            game.variant || null,
            new Date(),
            new Date()
          ]);

          migratedCount++;
          console.log(`✅ Created game: ${game.name} (Firebase ID: ${firebaseId} -> PostgreSQL ID: ${result.rows[0].id})`);
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