import { config } from 'dotenv';
import admin from 'firebase-admin';

config();

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const firestore = admin.firestore();

async function analyzeTrophiesStructure() {
  console.log('🏆 Analyzing trophies data structure...\n');

  try {
    // Check if trophies are stored as a global collection or subcollection
    console.log('📥 Checking for global trophies collection...');
    const globalTrophiesSnapshot = await firestore.collection('trophies').limit(5).get();
    
    if (!globalTrophiesSnapshot.empty) {
      console.log(`Found ${globalTrophiesSnapshot.size} trophies in global collection:`);
      globalTrophiesSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`  ${index + 1}. ${doc.id}:`, JSON.stringify(data, null, 2));
      });
    } else {
      console.log('No global trophies collection found');
    }

    // Check if trophies are stored in user subcollections
    console.log('\n📥 Checking for user-specific trophy subcollections...');
    const userDocsSnapshot = await firestore.collection('users').limit(3).get();
    
    let foundUserTrophies = false;
    for (const userDoc of userDocsSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`\n👤 Checking user ${userId}:`);
      
      // Check for trophies subcollection
      const userTrophiesSnapshot = await firestore
        .collection('users')
        .doc(userId)
        .collection('trophies')
        .limit(3)
        .get();
        
      if (!userTrophiesSnapshot.empty) {
        foundUserTrophies = true;
        console.log(`  📊 Found ${userTrophiesSnapshot.size} trophies:`);
        userTrophiesSnapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          console.log(`    ${index + 1}. ${doc.id}:`, JSON.stringify(data, null, 2));
        });
      } else {
        console.log(`  No trophies found for this user`);
      }
      
      // Check for save-specific trophy subcollections
      const savesSnapshot = await firestore
        .collection('users')
        .doc(userId)
        .collection('saves')
        .limit(2)
        .get();
        
      for (const saveDoc of savesSnapshot.docs) {
        const saveId = saveDoc.id;
        const saveTrophiesSnapshot = await firestore
          .collection('users')
          .doc(userId)
          .collection('saves')
          .doc(saveId)
          .collection('trophies')
          .limit(2)
          .get();
          
        if (!saveTrophiesSnapshot.empty) {
          foundUserTrophies = true;
          console.log(`  📊 Found ${saveTrophiesSnapshot.size} trophies in save ${saveId}:`);
          saveTrophiesSnapshot.docs.forEach((doc, index) => {
            const data = doc.data();
            console.log(`    ${index + 1}. ${doc.id}:`, JSON.stringify(data, null, 2));
          });
          break; // Only check first save with trophies
        }
      }
    }

    if (!foundUserTrophies) {
      console.log('No user-specific trophies found in subcollections');
    }

    // Let's also check the admin user specifically since they likely have the most data
    console.log('\n👤 Checking admin user specifically...');
    const adminUserId = 'tgXQqKofRIUMtNHpMyuAwdmSKdS2';
    
    // Check user trophies
    const adminUserTrophiesSnapshot = await firestore
      .collection('users')
      .doc(adminUserId)
      .collection('trophies')
      .limit(5)
      .get();
      
    if (!adminUserTrophiesSnapshot.empty) {
      console.log(`📊 Admin user has ${adminUserTrophiesSnapshot.size} user-level trophies:`);
      adminUserTrophiesSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`  ${index + 1}. ${doc.id}:`, JSON.stringify(data, null, 2));
      });
    }
    
    // Check save trophies for admin user
    const adminSavesSnapshot = await firestore
      .collection('users')
      .doc(adminUserId)
      .collection('saves')
      .limit(3)
      .get();
      
    for (const saveDoc of adminSavesSnapshot.docs) {
      const saveId = saveDoc.id;
      const saveData = saveDoc.data();
      const saveTrophiesSnapshot = await firestore
        .collection('users')
        .doc(adminUserId)
        .collection('saves')
        .doc(saveId)
        .collection('trophies')
        .limit(3)
        .get();
        
      if (!saveTrophiesSnapshot.empty) {
        console.log(`\n📊 Save "${saveData.teamName}" (${saveId}) has ${saveTrophiesSnapshot.size} trophies:`);
        saveTrophiesSnapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          console.log(`  ${index + 1}. ${doc.id}:`, JSON.stringify(data, null, 2));
        });
      } else {
        console.log(`\n📊 Save "${saveData.teamName}" (${saveId}) has no trophies`);
      }
    }

  } catch (error) {
    console.error('Error analyzing trophy structure:', error);
  } finally {
    process.exit(0);
  }
}

analyzeTrophiesStructure();