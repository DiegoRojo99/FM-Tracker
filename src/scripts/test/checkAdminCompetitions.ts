import { adminDB } from '../../lib/auth/firebase-admin';

// Quick test to check if AdminCompetitions exist
async function checkAdminCompetitions() {
  console.log('🔍 Checking AdminCompetitions collection...');
  
  try {
    const snapshot = await adminDB.collection('adminCompetitions').limit(5).get();
    
    if (snapshot.empty) {
      console.log('❌ AdminCompetitions collection is empty');
      console.log('💡 Need to run: npx tsx src/scripts/migration/createGameCompetitions.ts');
    } else {
      console.log(`✅ Found ${snapshot.size} AdminCompetitions (showing first 5)`);
      
      snapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. ${data.name} (${data.countryCode}) - Visible: ${data.isVisible}`);
      });
    }
    
    // Also check ApiCompetitions
    const apiSnapshot = await adminDB.collection('apiCompetitions').limit(3).get();
    console.log(`\n📊 ApiCompetitions: ${apiSnapshot.size} found`);
    
  } catch (error) {
    console.error('❌ Error checking collections:', error);
  }
}

if (require.main === module) {
  checkAdminCompetitions()
    .then(() => {
      console.log('\n✅ Check complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Check failed:', error);
      process.exit(1);
    });
}