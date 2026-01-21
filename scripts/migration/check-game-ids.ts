import { adminDB } from '../../src/lib/auth/firebase-admin';

async function checkGameIds() {
  try {
    const firestore = adminDB;
    const usersSnapshot = await firestore.collection('users').get();
    const gameIds = new Set<string>();
    
    for (const userDoc of usersSnapshot.docs) {
      const savesSnapshot = await userDoc.ref.collection('saves').get();
      savesSnapshot.docs.forEach(saveDoc => {
        const saveData = saveDoc.data();
        if (saveData.gameId) {
          gameIds.add(saveData.gameId);
        }
      });
    }
    
    console.log('🎮 Game IDs found in Firebase saves:');
    Array.from(gameIds).sort().forEach(id => {
      console.log(`  - ${id}`);
    });
    
    console.log(`\n📊 Total unique game IDs: ${gameIds.size}`);
    
  } catch (error) {
    console.error('💥 Failed:', error);
  }
}

checkGameIds();