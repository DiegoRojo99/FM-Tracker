import { adminDB } from '../../lib/auth/firebase-admin';

const SAVES_COLLECTION = 'saves';
const DEFAULT_GAME_ID = 'fm24'; // All existing saves will be assigned to FM24

export async function migrateSavesToIncludeGameId() {
  console.log('Starting migration to add gameId to existing saves...');
  
  try {
    // Get all users first
    const usersCollection = adminDB.collection('users');
    const usersSnapshot = await usersCollection.get();
    
    if (usersSnapshot.empty) {
      console.log('No users found.');
      return;
    }
    
    console.log(`Found ${usersSnapshot.docs.length} users to check for saves.`);
    
    let totalSavesFound = 0;
    let totalSavesMigrated = 0;
    
    // Use batched writes for better performance
    let batch = adminDB.batch();
    let batchCount = 0;
    const BATCH_SIZE = 500; // Firestore batch limit
    
    // Iterate through each user
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`Checking saves for user: ${userId}`);
      
      // Get saves subcollection for this user
      const savesCollection = usersCollection.doc(userId).collection(SAVES_COLLECTION);
      const savesSnapshot = await savesCollection.get();
      
      if (!savesSnapshot.empty) {
        console.log(`Found ${savesSnapshot.docs.length} saves for user ${userId}`);
        totalSavesFound += savesSnapshot.docs.length;
        
        for (const saveDoc of savesSnapshot.docs) {
          const saveData = saveDoc.data();
          
          // Only update saves that don't already have a gameId
          if (!saveData.gameId) {
            const saveRef = savesCollection.doc(saveDoc.id);
            batch.update(saveRef, {
              gameId: DEFAULT_GAME_ID,
              updatedAt: new Date()
            });
            
            batchCount++;
            totalSavesMigrated++;
            console.log(`Queued save ${saveDoc.id} (user: ${userId}) for migration (${batchCount})`);
            
            // Commit batch if we reach the limit
            if (batchCount >= BATCH_SIZE) {
              await batch.commit();
              console.log(`Committed batch of ${batchCount} saves.`);
              // Create new batch for remaining items
              batch = adminDB.batch();
              batchCount = 0;
            }
          } else {
            console.log(`Save ${saveDoc.id} (user: ${userId}) already has gameId: ${saveData.gameId}, skipping.`);
          }
        }
      } else {
        console.log(`No saves found for user ${userId}`);
      }
    }
    
    // Commit remaining saves
    if (batchCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${batchCount} saves.`);
    }
    
    console.log('Migration completed successfully!');
    console.log(`Total saves found: ${totalSavesFound}`);
    console.log(`Total saves migrated: ${totalSavesMigrated}`);
    
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}

// Function to run the migration
if (require.main === module) {
  migrateSavesToIncludeGameId()
    .then(() => {
      console.log('Migration process completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}