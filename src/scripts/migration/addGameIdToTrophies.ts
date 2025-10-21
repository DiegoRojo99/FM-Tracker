import { adminDB } from '../../lib/auth/firebase-admin';

const DEFAULT_GAME_ID = 'FM24'; // Fallback if save doesn't have gameId

export async function migrateTrophiesToIncludeGameId() {
  console.log('Starting migration to add gameId to existing trophies...');
  
  try {
    // Get all users first
    const usersCollection = adminDB.collection('users');
    const usersSnapshot = await usersCollection.get();
    
    if (usersSnapshot.empty) {
      console.log('No users found.');
      return;
    }
    
    console.log(`Found ${usersSnapshot.docs.length} users to check for saves and trophies.`);
    
    let totalTrophiesFound = 0;
    let totalTrophiesMigrated = 0;
    let totalSavesProcessed = 0;
    
    // Use batched writes for better performance
    let batch = adminDB.batch();
    let batchCount = 0;
    const BATCH_SIZE = 500; // Firestore batch limit
    
    // Iterate through each user
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`\n📁 Processing user: ${userId}`);
      
      // Get saves subcollection for this user
      const savesCollection = usersCollection.doc(userId).collection('saves');
      const savesSnapshot = await savesCollection.get();
      
      if (savesSnapshot.empty) {
        console.log(`No saves found for user ${userId}`);
        continue;
      }
      
      console.log(`Found ${savesSnapshot.docs.length} saves for user ${userId}`);
      
      // Iterate through each save
      for (const saveDoc of savesSnapshot.docs) {
        const saveId = saveDoc.id;
        const saveData = saveDoc.data();
        const gameId = saveData.gameId || DEFAULT_GAME_ID;
        
        totalSavesProcessed++;
        console.log(`\n  💾 Processing save: ${saveId} (game: ${gameId})`);
        
        // Get trophies subcollection for this save
        const trophiesCollection = savesCollection.doc(saveId).collection('trophies');
        const trophiesSnapshot = await trophiesCollection.get();
        
        if (trophiesSnapshot.empty) {
          console.log(`    No trophies found for save ${saveId}`);
          continue;
        }
        
        console.log(`    Found ${trophiesSnapshot.docs.length} trophies for save ${saveId}`);
        totalTrophiesFound += trophiesSnapshot.docs.length;
        
        // Update each trophy that doesn't have a gameId
        for (const trophyDoc of trophiesSnapshot.docs) {
          const trophyData = trophyDoc.data();
          
          // Only update trophies that don't already have a gameId
          if (!trophyData.game) {
            const trophyRef = trophiesCollection.doc(trophyDoc.id);
            batch.update(trophyRef, {
              game: gameId,
              updatedAt: new Date()
            });
            
            batchCount++;
            totalTrophiesMigrated++;
            console.log(`    ✅ Queued trophy ${trophyDoc.id} for migration (${batchCount}) - Competition: ${trophyData.competitionName}`);
            
            // Commit batch if we reach the limit
            if (batchCount >= BATCH_SIZE) {
              await batch.commit();
              console.log(`\n🔄 Committed batch of ${batchCount} trophies.`);
              // Create new batch for remaining items
              batch = adminDB.batch();
              batchCount = 0;
            }
          } else {
            console.log(`    ⏭️  Trophy ${trophyDoc.id} already has game: ${trophyData.game}, skipping.`);
          }
        }
      }
    }
    
    // Commit remaining trophies
    if (batchCount > 0) {
      await batch.commit();
      console.log(`\n🔄 Committed final batch of ${batchCount} trophies.`);
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Users processed: ${usersSnapshot.docs.length}`);
    console.log(`   - Saves processed: ${totalSavesProcessed}`);
    console.log(`   - Total trophies found: ${totalTrophiesFound}`);
    console.log(`   - Total trophies migrated: ${totalTrophiesMigrated}`);
    console.log(`   - Trophies already had game ID: ${totalTrophiesFound - totalTrophiesMigrated}`);
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
}

// Helper function to validate migration results
export async function validateTrophyMigration() {
  console.log('\n🔍 Validating trophy migration results...');
  
  try {
    const usersCollection = adminDB.collection('users');
    const usersSnapshot = await usersCollection.get();
    
    let totalTrophies = 0;
    let trophiesWithGame = 0;
    let trophiesWithoutGame = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const savesCollection = usersCollection.doc(userId).collection('saves');
      const savesSnapshot = await savesCollection.get();
      
      for (const saveDoc of savesSnapshot.docs) {
        const trophiesCollection = savesCollection.doc(saveDoc.id).collection('trophies');
        const trophiesSnapshot = await trophiesCollection.get();
        
        for (const trophyDoc of trophiesSnapshot.docs) {
          const trophyData = trophyDoc.data();
          totalTrophies++;
          
          if (trophyData.game) {
            trophiesWithGame++;
          } else {
            trophiesWithoutGame++;
            console.log(`⚠️  Trophy without game: ${trophyDoc.id} in save ${saveDoc.id} (user: ${userId})`);
          }
        }
      }
    }
    
    console.log('\n📊 Validation Results:');
    console.log(`   - Total trophies: ${totalTrophies}`);
    console.log(`   - Trophies with game ID: ${trophiesWithGame}`);
    console.log(`   - Trophies missing game ID: ${trophiesWithoutGame}`);
    
    if (trophiesWithoutGame === 0) {
      console.log('✅ All trophies have game IDs!');
    } else {
      console.log(`❌ ${trophiesWithoutGame} trophies are still missing game IDs.`);
    }
    
  } catch (error) {
    console.error('❌ Error during validation:', error);
    throw error;
  }
}

// Function to run the migration
if (require.main === module) {
  const runValidation = process.argv.includes('--validate');
  
  if (runValidation) {
    validateTrophyMigration()
      .then(() => {
        console.log('Validation completed.');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Validation failed:', error);
        process.exit(1);
      });
  } else {
    migrateTrophiesToIncludeGameId()
      .then(() => {
        console.log('Migration process completed.');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Migration process failed:', error);
        process.exit(1);
      });
  }
}