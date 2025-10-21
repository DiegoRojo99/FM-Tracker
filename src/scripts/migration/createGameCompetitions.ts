import { adminDB } from '../../lib/auth/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Create AdminCompetitions from existing ApiCompetitions
export async function createAdminCompetitionsFromApi() {
  console.log('🎮 Creating AdminCompetitions from ApiCompetitions...');

  const apiCompsSnapshot = await adminDB.collection('apiCompetitions').get();
  console.log(`Found ${apiCompsSnapshot.size} API competitions`);

  let created = 0;
  let skipped = 0;

  for (const apiCompDoc of apiCompsSnapshot.docs) {
    const apiComp = apiCompDoc.data();
    
    try {
      // Check if AdminCompetition already exists
      const adminCompDoc = await adminDB
        .collection('adminCompetitions')
        .doc(apiCompDoc.id)
        .get();

      if (!adminCompDoc.exists) {
        // Create new AdminCompetition
        await adminDB
          .collection('adminCompetitions')
          .doc(apiCompDoc.id)
          .set({
            apiCompetitionId: apiComp.id,
            name: apiComp.name,
            displayName: apiComp.name, // Can be customized
            countryCode: apiComp.countryCode,
            countryName: apiComp.countryName,
            type: apiComp.type,
            
            // Game-specific settings
            isVisible: true, // Show in dropdowns by default
            isGrouped: false, // Not grouped by default
            groupName: null, // For grouped competitions
            groupOrder: null, // Order within group
            
            // Display settings
            priority: calculatePriority(apiComp),
            sortOrder: 0,
            logoUrl: apiComp.logo || '',
            
            // Metadata
            createdAt: Timestamp.now(),
            lastUpdated: Timestamp.now(),
            createdBy: 'migration'
          });

        created++;
        console.log(`✅ Created AdminCompetition: ${apiComp.name} (${apiComp.countryCode})`);
      } else {
        skipped++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${apiComp.name}:`, error);
    }
  }

  console.log(`\n📊 AdminCompetitions creation complete:`);
  console.log(`- Created: ${created} competitions`);
  console.log(`- Skipped: ${skipped} (already exist)`);
  console.log(`- Total API competitions: ${apiCompsSnapshot.size}`);

  return { created, skipped };
}

// Calculate priority based on competition characteristics
function calculatePriority(apiComp: FirebaseFirestore.DocumentData): number {
  let priority = 0;

  // Top countries get higher priority
  const topCountries = ['GB-ENG', 'ES', 'DE', 'IT', 'FR', 'BR', 'AR', 'NL', 'PT'];
  if (topCountries.includes(apiComp.countryCode)) {
    priority += 100;
  }

  // Top tier leagues get highest priority
  if (isTopTierLeague(apiComp.name)) {
    priority += 500;
  } else if (isSecondTierLeague(apiComp.name)) {
    priority += 300;
  } else if (isThirdTierLeague(apiComp.name)) {
    priority += 200;
  }

  return priority;
}

function isTopTierLeague(name: string): boolean {
  const topTierPatterns = [
    'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1',
    'Primeira Liga', 'Eredivisie', 'Série A', 'Liga Profesional',
    'Jupiler Pro League', 'Allsvenskan', 'Eliteserien', 'Ekstraklasa'
  ];
  
  return topTierPatterns.some(pattern => 
    name.toLowerCase().includes(pattern.toLowerCase())
  );
}

function isSecondTierLeague(name: string): boolean {
  const secondTierPatterns = [
    'Championship', 'Segunda División', 'Serie B', '2. Bundesliga', 'Ligue 2',
    'Segunda Liga', 'Eerste Divisie', 'Primera Nacional', 'Challenger Pro League',
    'Superettan', '1. Division', 'I Liga'
  ];
  
  return secondTierPatterns.some(pattern => 
    name.toLowerCase().includes(pattern.toLowerCase())
  );
}

function isThirdTierLeague(name: string): boolean {
  const thirdTierPatterns = [
    'League One', 'League Two', 'Primera RFEF', 'Serie C', '3. Liga',
    'National 1', 'National League'
  ];
  
  return thirdTierPatterns.some(pattern => 
    name.toLowerCase().includes(pattern.toLowerCase())
  );
}

// Group Spanish competitions as an example
export async function groupSpanishCompetitions() {
  console.log('🇪🇸 Grouping Spanish competitions...');

  const spanishGroups = [
    {
      groupName: 'La Liga System',
      competitions: ['La Liga', 'Segunda División']
    },
    {
      groupName: 'Primera RFEF',
      competitions: ['Primera División RFEF - Group 1', 'Primera División RFEF - Group 2']
    },
    {
      groupName: 'Segunda RFEF',
      competitions: [
        'Segunda División RFEF - Group 1', 
        'Segunda División RFEF - Group 2',
        'Segunda División RFEF - Group 3',
        'Segunda División RFEF - Group 4',
        'Segunda División RFEF - Group 5'
      ]
    }
  ];

  for (const group of spanishGroups) {
    let groupOrder = 1;
    
    for (const compName of group.competitions) {
      // Find the competition
      const adminCompsSnapshot = await adminDB
        .collection('adminCompetitions')
        .where('name', '==', compName)
        .where('countryCode', '==', 'ES')
        .get();

      for (const doc of adminCompsSnapshot.docs) {
        await doc.ref.update({
          isGrouped: true,
          groupName: group.groupName,
          groupOrder: groupOrder++,
          lastUpdated: Timestamp.now()
        });
        
        console.log(`✅ Grouped: ${compName} → ${group.groupName}`);
      }
    }
  }
}

if (require.main === module) {
  createAdminCompetitionsFromApi()
    .then(async () => {
      console.log('\n🇪🇸 Setting up Spanish league grouping...');
      await groupSpanishCompetitions();
      console.log('\n🎉 AdminCompetitions setup completed successfully!');
      process.exit(0);
    })
    .catch((error: unknown) => {
      console.error('❌ AdminCompetitions setup failed:', error);
      process.exit(1);
    });
}