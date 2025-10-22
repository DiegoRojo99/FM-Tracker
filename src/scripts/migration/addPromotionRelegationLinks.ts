import { AdminCompetition, AdminCompetitionWithId } from '@/lib/types/AdminCompetition';
import { adminDB } from '../../lib/auth/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Simple script to add promotion/relegation target fields to adminCompetitions
 */
export async function addPromotionRelegationFields() {
  console.log('🔗 Adding promotion/relegation target fields to adminCompetitions...');
  
  const snapshot = await adminDB.collection('adminCompetitions').get();
  let processed = 0;
  let updated = 0;
  
  const batch = adminDB.batch();
  
  for (const doc of snapshot.docs) {
    const competition = doc.data();
    processed++;
    
    // Check if already has the new fields
    if (competition.promotionTargetId !== undefined || competition.relegationTargetId !== undefined) {
      console.log(`⏭️  ${competition.name} already has promotion/relegation fields`);
      continue;
    }
    
    // Add the new fields (initially empty)
    const updateData = {
      promotionTargetId: null, // Competition ID for promotion target
      relegationTargetId: null, // Competition ID for relegation target
      lastUpdated: Timestamp.now()
    };
    
    batch.update(doc.ref, updateData);
    updated++;
    
    console.log(`✅ Added fields to: ${competition.name} (${competition.countryCode})`);
    
    // Execute batch every 100 operations
    if (updated % 100 === 0) {
      await batch.commit();
      console.log(`💾 Committed batch of ${updated} updates`);
    }
  }
  
  // Commit final batch
  if (updated % 100 !== 0) {
    await batch.commit();
  }
  
  console.log(`\n🎉 Enhancement completed!`);
  console.log(`📊 Processed: ${processed} competitions`);
  console.log(`✅ Updated: ${updated} competitions`);
  console.log(`⏭️  Skipped: ${processed - updated} competitions (already enhanced)`);
}

// Setup some example promotion/relegation links for Spanish competitions
export async function setupExampleSpanishLinks() {
  console.log('🇪🇸 Setting up example Spanish promotion/relegation links...');
  
  const spanishComps = await adminDB.collection('adminCompetitions')
    .where('countryCode', '==', 'ES')
    .where('type', '==', 'League')
    .get();
  
  const competitions = spanishComps.docs.map(doc => ({
    id: doc.id,
    ...doc.data() as AdminCompetition
  })) as AdminCompetitionWithId[];
  
  // Find La Liga and Segunda División
  const laLiga = competitions.find(c => 
    c.name.toLowerCase().includes('la liga') || 
    c.name.toLowerCase().includes('primera división')
  );
  
  const segunda = competitions.find(c => 
    c.name.toLowerCase().includes('segunda división')
  );
  
  if (laLiga && segunda) {
    // La Liga relegates to Segunda División
    await adminDB.collection('adminCompetitions').doc(laLiga.id).update({
      relegationTargetId: segunda.id,
      lastUpdated: Timestamp.now()
    });
    
    // Segunda División promotes to La Liga
    await adminDB.collection('adminCompetitions').doc(segunda.id).update({
      promotionTargetId: laLiga.id,
      lastUpdated: Timestamp.now()
    });
    
    console.log(`✅ Linked La Liga ↔ Segunda División`);
  }
  
  // Find more Spanish divisions and link them
  const tercera = competitions.find(c => 
    c.name.toLowerCase().includes('tercera división') ||
    c.name.toLowerCase().includes('primera rfef')
  );
  
  if (segunda && tercera) {
    // Segunda División relegates to Tercera/Primera RFEF
    await adminDB.collection('adminCompetitions').doc(segunda.id).update({
      relegationTargetId: tercera.id,
      lastUpdated: Timestamp.now()
    });
    
    // Tercera/Primera RFEF promotes to Segunda División
    await adminDB.collection('adminCompetitions').doc(tercera.id).update({
      promotionTargetId: segunda.id,
      lastUpdated: Timestamp.now()
    });
    
    console.log(`✅ Linked Segunda División ↔ ${tercera.name}`);
  }
  
  console.log('🎉 Spanish example links setup completed!');
}

// Main execution
if (require.main === module) {
  addPromotionRelegationFields()
    .then(async () => {
      console.log('\n🇪🇸 Setting up example Spanish links...');
      await setupExampleSpanishLinks();
      console.log('\n🎉 All enhancements completed successfully!');
      console.log('\n💡 You can now use the admin interface to set up more promotion/relegation links!');
      process.exit(0);
    })
    .catch((error: unknown) => {
      console.error('❌ Error adding promotion/relegation fields:', error);
      process.exit(1);
    });
}