import { adminDB } from '../../src/lib/auth/firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

async function examineSaveData() {
  try {
    const firestore = adminDB;
    
    console.log('🔍 Examining saves data structure...\n');
    
    // Get users first, then their saves subcollections
    const usersSnapshot = await firestore.collection('users').limit(3).get();
    console.log(`👥 Found ${usersSnapshot.size} users to examine for saves`);
    
    if (usersSnapshot.size === 0) {
      console.log('❌ No users found in Firebase');
      return;
    }
    
    let totalSaves = 0;
    let userCount = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      userCount++;
      console.log(`\n--- User ${userCount}: ${userDoc.id} ---`);
      
      // Get saves subcollection for this user
      const savesSnapshot = await userDoc.ref.collection('saves').get();
      totalSaves += savesSnapshot.size;
      console.log(`📦 This user has ${savesSnapshot.size} saves`);
      
      // Examine first few saves for this user
      let saveCount = 0;
      for (const saveDoc of savesSnapshot.docs) {
        saveCount++;
        if (saveCount > 2) break; // Limit to first 2 saves per user
        
        const saveData = saveDoc.data();
        console.log(`\n  Save ${saveCount} (${saveDoc.id}):`);
        console.log('  ', JSON.stringify(saveData, null, 4));
        
        // Check subcollections of the save
        const stintsSnapshot = await saveDoc.ref.collection('stints').limit(2).get();
        if (stintsSnapshot.size > 0) {
          console.log(`\n  Stints subcollection (${stintsSnapshot.size} docs):`);
          stintsSnapshot.docs.forEach((stintDoc, i) => {
            console.log(`    Stint ${i + 1}:`, JSON.stringify(stintDoc.data(), null, 4));
          });
        }
        
        const seasonsSnapshot = await saveDoc.ref.collection('seasons').limit(2).get();
        if (seasonsSnapshot.size > 0) {
          console.log(`\n  Seasons subcollection (${seasonsSnapshot.size} docs):`);
          seasonsSnapshot.docs.forEach((seasonDoc, i) => {
            console.log(`    Season ${i + 1}:`, JSON.stringify(seasonDoc.data(), null, 4));
          });
        }
      }
    }
    
    console.log(`\n📊 Total saves found: ${totalSaves}`);

  } catch (error) {
    console.error('💥 Examination failed:', error);
  }
}

examineSaveData();