import { config } from 'dotenv';
import admin from 'firebase-admin';
import { Pool } from 'pg';

config();

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

const db = admin.firestore();

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function analyzeCompetitionGaps() {
  console.log('🔍 Analyzing competition gaps between challenges and migrated data...\n');

  // 1. Get competition IDs referenced in challenges
  console.log('📋 Getting competition IDs from challenges...');
  const challengesSnapshot = await db.collection('challenges').get();
  const challengeCompetitionIds = new Set<string>();
  
  challengesSnapshot.docs.forEach(doc => {
    const challenge = doc.data();
    challenge.goals?.forEach((goal: any) => {
      if (goal.competitionId) {
        challengeCompetitionIds.add(goal.competitionId);
      }
    });
  });

  console.log(`Found ${challengeCompetitionIds.size} unique competition IDs in challenges:`);
  console.log(Array.from(challengeCompetitionIds).sort((a, b) => parseInt(a) - parseInt(b)));

  // 2. Get what's currently in our PostgreSQL database
  console.log('\n🏆 Checking migrated competitions in PostgreSQL...');
  const migratedCompetitions = await pool.query(`
    SELECT DISTINCT cgac."apiCompetitionId" as api_id
    FROM "CompetitionGroupApiCompetition" cgac
    ORDER BY cgac."apiCompetitionId"
  `);

  const migratedCompetitionIds = new Set(migratedCompetitions.rows.map(row => String(row.api_id)));
  console.log(`Found ${migratedCompetitionIds.size} migrated competition IDs`);

  // 3. Find missing competitions
  const missingCompetitionIds = Array.from(challengeCompetitionIds).filter(id => 
    !migratedCompetitionIds.has(id)
  );

  console.log(`\n❌ Missing competitions (${missingCompetitionIds.length}):`);
  missingCompetitionIds.forEach(id => console.log(`  Competition ID: ${id}`));

  // 4. Check if missing competitions exist in Firestore apiCompetitions collection
  console.log('\n🔎 Checking if missing competitions exist in apiCompetitions collection...');
  const missingInFirestore: string[] = [];
  const availableInFirestore: any[] = [];

  for (const competitionId of missingCompetitionIds) {
    try {
      const apiCompDoc = await db.collection('apiCompetitions').doc(competitionId).get();
      if (apiCompDoc.exists) {
        const data = apiCompDoc.data();
        availableInFirestore.push({
          id: competitionId,
          name: data?.name,
          type: data?.type,
          country: data?.countryName
        });
      } else {
        missingInFirestore.push(competitionId);
      }
    } catch (error) {
      missingInFirestore.push(competitionId);
    }
  }

  console.log(`\n✅ Available in apiCompetitions (${availableInFirestore.length}):`);
  availableInFirestore.forEach(comp => {
    console.log(`  ID ${comp.id}: ${comp.name} (${comp.type}) - ${comp.country}`);
  });

  console.log(`\n💔 Not found in apiCompetitions (${missingInFirestore.length}):`);
  missingInFirestore.forEach(id => console.log(`  Competition ID: ${id}`));

  // 5. Check adminCompetitions collection for completeness
  console.log('\n📊 Checking adminCompetitions vs apiCompetitions coverage...');
  const [adminCompetitions, allApiCompetitions] = await Promise.all([
    db.collection('adminCompetitions').get(),
    db.collection('apiCompetitions').get()
  ]);

  const adminCompetitionApiIds = new Set<string>();
  adminCompetitions.docs.forEach(doc => {
    const data = doc.data();
    if (data.apiCompetitionId) {
      adminCompetitionApiIds.add(String(data.apiCompetitionId));
    }
  });

  const allApiCompetitionIds = new Set<string>();
  allApiCompetitions.docs.forEach(doc => {
    allApiCompetitionIds.add(doc.id);
  });

  console.log(`\nAdmin competitions reference: ${adminCompetitionApiIds.size} API competition IDs`);
  console.log(`Total apiCompetitions available: ${allApiCompetitionIds.size} competitions`);

  const uncoveredApiCompetitions = Array.from(allApiCompetitionIds).filter(id => 
    !adminCompetitionApiIds.has(id)
  );

  console.log(`\n🔍 API competitions not covered by admin (${uncoveredApiCompetitions.length}):`);
  if (uncoveredApiCompetitions.length > 0) {
    const samples = uncoveredApiCompetitions.slice(0, 10);
    for (const apiId of samples) {
      const doc = await db.collection('apiCompetitions').doc(apiId).get();
      const data = doc.data();
      console.log(`  ID ${apiId}: ${data?.name} (${data?.type}) - ${data?.countryName}`);
    }
    if (uncoveredApiCompetitions.length > 10) {
      console.log(`  ... and ${uncoveredApiCompetitions.length - 10} more`);
    }
  }

  return {
    challengeCompetitionIds: Array.from(challengeCompetitionIds),
    migratedCompetitionIds: Array.from(migratedCompetitionIds),
    missingCompetitionIds,
    availableInFirestore,
    missingInFirestore,
    uncoveredApiCompetitions: uncoveredApiCompetitions.length
  };
}

async function suggestSolution(analysis: any) {
  console.log('\n💡 SUGGESTED SOLUTIONS:\n');
  
  if (analysis.availableInFirestore.length > 0) {
    console.log(`🔧 SOLUTION 1: Migrate missing API competitions directly`);
    console.log(`   Create a supplementary migration to add ${analysis.availableInFirestore.length} competitions:`);
    analysis.availableInFirestore.forEach((comp: any) => {
      console.log(`   - Add ${comp.name} (ID: ${comp.id}) as individual competition group`);
    });
  }

  if (analysis.uncoveredApiCompetitions > 0) {
    console.log(`\n🔧 SOLUTION 2: Expand competition migration strategy`);
    console.log(`   Current strategy only migrates competitions with admin entries (${analysis.migratedCompetitionIds.length})`);
    console.log(`   But ${analysis.uncoveredApiCompetitions} API competitions exist without admin entries`);
    console.log(`   Consider: Migrate ALL apiCompetitions, then create admin groupings as needed`);
  }

  if (analysis.missingInFirestore.length > 0) {
    console.log(`\n🔧 SOLUTION 3: Update challenge references`);
    console.log(`   ${analysis.missingInFirestore.length} competition IDs in challenges don't exist in Firestore`);
    console.log(`   These may be outdated references that need updating`);
  }

  console.log(`\n🎯 RECOMMENDED ACTION:`);
  console.log(`   1. Create supplementary competition migration for challenge-referenced competitions`);
  console.log(`   2. Add these as individual CompetitionGroup entries`); 
  console.log(`   3. Re-run global challenges migration to get proper FK relationships`);
}

async function main() {
  try {
    const analysis = await analyzeCompetitionGaps();
    await suggestSolution(analysis);
    
    console.log('\n✅ Competition gap analysis completed!');
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}