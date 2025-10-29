import { adminDB } from '../../lib/auth/firebase-admin';

const DEFAULT_GAME_ID = 'FM24'; // Fallback if save doesn't have gameId

export async function migrateChallengesToIncludeGameId() {
  console.log('Starting migration to add gameId to existing challenges...');

  try {
    // Get all users first
    const usersCollection = adminDB.collection('users');
    const usersSnapshot = await usersCollection.get();

    if (usersSnapshot.empty) {
      console.log('No users found.');
      return;
    }

    console.log(`Found ${usersSnapshot.docs.length} users to check for saves and challenges.`);

    let totalChallengesFound = 0;
    let totalChallengesMigrated = 0;
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

        // Get challenges subcollection for this save
        const challengesCollection = savesCollection.doc(saveId).collection('challenges');
        const challengesSnapshot = await challengesCollection.get();

        if (challengesSnapshot.empty) {
          console.log(`    No challenges found for save ${saveId}`);
          continue;
        }

        console.log(`    Found ${challengesSnapshot.docs.length} challenges for save ${saveId}`);
        totalChallengesFound += challengesSnapshot.docs.length;

        // Update each challenge that doesn't have a gameId
        for (const challengeDoc of challengesSnapshot.docs) {
          const challengeData = challengeDoc.data();

          // Only update challenges that don't already have a gameId
          if (!challengeData.gameId) {
            const challengeRef = challengesCollection.doc(challengeDoc.id);
            batch.update(challengeRef, {
              gameId: gameId,
              updatedAt: new Date()
            });

            batchCount++;
            totalChallengesMigrated++;
            console.log(`    ✅ Queued challenge ${challengeDoc.id} for migration (${batchCount}) - Challenge: ${challengeData.name}`);

            // Commit batch if we reach the limit
            if (batchCount >= BATCH_SIZE) {
              await batch.commit();
              console.log(`\n🔄 Committed batch of ${batchCount} challenges.`);
              // Create new batch for remaining items
              batch = adminDB.batch();
              batchCount = 0;
            }
          } else {
            console.log(`    ⏭️  Challenge ${challengeDoc.id} already has gameId: ${challengeData.gameId}, skipping.`);
          }
        }
      }
    }

    // Commit remaining challenges
    if (batchCount > 0) {
      await batch.commit();
      console.log(`\n🔄 Committed final batch of ${batchCount} challenges.`);
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Users processed: ${usersSnapshot.docs.length}`);
    console.log(`   - Saves processed: ${totalSavesProcessed}`);
    console.log(`   - Total challenges found: ${totalChallengesFound}`);
    console.log(`   - Total challenges migrated: ${totalChallengesMigrated}`);
    console.log(`   - Challenges already had game ID: ${totalChallengesFound - totalChallengesMigrated}`);

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
}

// Helper function to validate migration results
export async function validateChallengeMigration() {
  console.log('\n🔍 Validating challenge migration results...');

  try {
    const usersCollection = adminDB.collection('users');
    const usersSnapshot = await usersCollection.get();

    let totalChallenges = 0;
    let challengesWithGame = 0;
    let challengesWithoutGame = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const savesCollection = usersCollection.doc(userId).collection('saves');
      const savesSnapshot = await savesCollection.get();

      for (const saveDoc of savesSnapshot.docs) {
        const challengesCollection = savesCollection.doc(saveDoc.id).collection('challenges');
        const challengesSnapshot = await challengesCollection.get();

        for (const challengeDoc of challengesSnapshot.docs) {
          const challengeData = challengeDoc.data();
          totalChallenges++;

          if (challengeData.gameId) {
            challengesWithGame++;
          } else {
            challengesWithoutGame++;
            console.log(`⚠️  Challenge without gameId: ${challengeDoc.id} in save ${saveDoc.id} (user: ${userId})`);
          }
        }
      }
    }

    console.log('\n📊 Validation Results:');
    console.log(`   - Total challenges: ${totalChallenges}`);
    console.log(`   - Challenges with game ID: ${challengesWithGame}`);
    console.log(`   - Challenges missing game ID: ${challengesWithoutGame}`);

    if (challengesWithoutGame === 0) {
      console.log('✅ All challenges have game IDs!');
    } else {
      console.log(`❌ ${challengesWithoutGame} challenges are still missing game IDs.`);
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
    validateChallengeMigration()
      .then(() => {
        console.log('Validation completed.');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Validation failed:', error);
        process.exit(1);
      });
  } else {
    migrateChallengesToIncludeGameId()
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
