import { adminDB } from '../../src/lib/auth/firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

async function examineStintsData() {
  try {
    const firestore = adminDB;
    const adminUserId = process.env.NEXT_PUBLIC_ADMIN_UID;
    
    if (!adminUserId) {
      console.error('❌ NEXT_PUBLIC_ADMIN_UID not found in env');
      return;
    }
    
    console.log(`🔍 Examining subcollections for admin user: ${adminUserId}\n`);
    
    // Get admin user's saves
    const userDoc = firestore.collection('users').doc(adminUserId);
    const savesSnapshot = await userDoc.collection('saves').get();
    
    console.log(`📦 Found ${savesSnapshot.size} saves for admin user`);
    
    for (let i = 0; i < Math.min(3, savesSnapshot.size); i++) {
      const saveDoc = savesSnapshot.docs[i];
      console.log(`\n--- Save ${i + 1}: ${saveDoc.id} ---`);
      
      try {
        // List all subcollections for this save
        const subcollections = await saveDoc.ref.listCollections();
        console.log(`📂 Subcollections: ${subcollections.map(col => col.id).join(', ')}`);
        
        // Examine each subcollection
        for (const subcol of subcollections) {
          const subcolSnapshot = await subcol.get();
          console.log(`   ${subcol.id}: ${subcolSnapshot.size} documents`);
          
          // Show sample data from first document
          if (subcolSnapshot.size > 0) {
            const firstDoc = subcolSnapshot.docs[0];
            console.log(`   Sample ${subcol.id} data:`, JSON.stringify(firstDoc.data(), null, 6));
          }
        }
      } catch (error: any) {
        console.log(`   Error accessing subcollections: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('💥 Examination failed:', error);
  }
}

examineStintsData();