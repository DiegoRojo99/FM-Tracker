import { config } from 'dotenv';
import admin from 'firebase-admin';

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

async function getDetailedCareerChallengeStructure() {
  console.log('\n=== DETAILED CAREER CHALLENGE STRUCTURE ===');
  
  const usersSnapshot = await db.collection('users').get();
  console.log(`👥 Scanning ${usersSnapshot.docs.length} users for career challenges...`);

  let sampleCareerChallenges: any[] = [];
  let totalFound = 0;

  for (const userDoc of usersSnapshot.docs.slice(0, 10)) { // Limit to first 10 users for sample
    const userId = userDoc.id;
    
    try {
      const savesSnapshot = await db.collection('users').doc(userId).collection('saves').get();
      
      for (const saveDoc of savesSnapshot.docs) {
        const saveId = saveDoc.id;
        
        try {
          const challengesSnapshot = await db
            .collection('users').doc(userId)
            .collection('saves').doc(saveId)
            .collection('challenges').get();
          
          if (challengesSnapshot.docs.length > 0) {
            totalFound += challengesSnapshot.docs.length;
            
            // Get first few challenges as samples
            challengesSnapshot.docs.slice(0, 2).forEach(challengeDoc => {
              const challenge = {
                docId: challengeDoc.id,
                userId,
                saveId,
                ...challengeDoc.data()
              };
              sampleCareerChallenges.push(challenge);
            });
          }
        } catch (error) {
          console.log(`⚠️  Error reading challenges for save ${saveId}:`, error);
        }
      }
    } catch (error) {
      console.log(`⚠️  Error reading saves for user ${userId}:`, error);
    }
    
    // Stop after we have enough samples
    if (sampleCareerChallenges.length >= 5) break;
  }

  console.log(`📊 Found ${totalFound} total career challenges`);
  console.log(`📄 Sample career challenges (${sampleCareerChallenges.length}):`);
  
  sampleCareerChallenges.forEach((challenge, index) => {
    console.log(`\n--- Sample ${index + 1} ---`);
    console.log(JSON.stringify(challenge, null, 2));
  });

  return sampleCareerChallenges;
}

async function validateForeignKeyReferences() {
  console.log('\n=== FOREIGN KEY VALIDATION ===');
  
  // Get sample data to test references
  const [globalChallenges, careerChallenges] = await Promise.all([
    db.collection('challenges').get().then(snap => 
      snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    ),
    getDetailedCareerChallengeStructure()
  ]);

  console.log('\n🔍 Checking references...');
  
  // Check challenge ID references
  const globalChallengeIds = new Set(globalChallenges.map((c: any) => c.id));
  const invalidChallengeRefs = careerChallenges.filter((cc: any) => 
    !globalChallengeIds.has(cc.id)
  );

  console.log(`✅ Valid challenge references: ${careerChallenges.length - invalidChallengeRefs.length}/${careerChallenges.length}`);
  if (invalidChallengeRefs.length > 0) {
    console.log(`❌ Invalid challenge references:`, invalidChallengeRefs.map((cc: any) => cc.id));
  }

  // Check competition/team/country references in goals
  const competitionIds = new Set<string>();
  const teamIds = new Set<string>();
  const countryIds = new Set<string>();
  
  globalChallenges.forEach((challenge: any) => {
    challenge.goals?.forEach((goal: any) => {
      if (goal.competitionId) competitionIds.add(goal.competitionId);
      if (goal.teamGroup) goal.teamGroup.forEach((teamId: string) => teamIds.add(teamId));
      if (goal.countryId) countryIds.add(goal.countryId);
    });
  });

  console.log(`\n🔗 Entity references in challenges:`);
  console.log(`  Competition IDs: ${competitionIds.size} unique`);
  console.log(`  Team IDs: ${teamIds.size} unique`);
  console.log(`  Country IDs: ${countryIds.size} unique`);

  return {
    competitionIds: Array.from(competitionIds),
    teamIds: Array.from(teamIds),
    countryIds: Array.from(countryIds)
  };
}

async function analyzePostgreSQLMapping() {
  console.log('\n=== POSTGRESQL MAPPING STRATEGY ===');
  
  console.log(`\n📋 Challenge System Migration Plan:`);
  console.log(`
🏗️  DATABASE SCHEMA MAPPING:

1. Global Challenges (challenges collection → Challenge + ChallengeGoal tables)
   - Challenge table:
     * id (auto-increment) ← map from Firestore doc ID
     * name ← challenge.name
     * description ← challenge.description
     * bonus ← challenge.bonus (optional)
     * createdAt, updatedAt (timestamps)

   - ChallengeGoal table:
     * id (auto-increment)
     * challengeId (FK to Challenge.id)
     * goalId ← goal.id (original UUID)
     * description ← goal.description
     * competitionGroupId (FK to CompetitionGroup.id) ← map from goal.competitionId
     * countryCode (FK to Country.code) ← goal.countryId
     * createdAt

   - ChallengeGoalTeam junction table:
     * challengeGoalId (FK to ChallengeGoal.id)
     * teamId (FK to Team.id) ← map from goal.teamGroup[]

2. Career Challenges (user saves subcollection → CareerChallenge + CareerChallengeGoal tables)
   - CareerChallenge table:
     * id (auto-increment)
     * challengeId (FK to Challenge.id) ← map challenge.id
     * saveId (FK to Save.id) ← from subcollection path
     * gameId (FK to Game.id) ← map from challenge.gameId
     * startedAt ← challenge.startedAt
     * completedAt ← challenge.completedAt (optional)
     * createdAt, updatedAt

   - CareerChallengeGoal table:
     * id (auto-increment)
     * careerChallengeId (FK to CareerChallenge.id)
     * challengeGoalId (FK to ChallengeGoal.id)
     * isCompleted (boolean) ← derived from challenge.completedGoals[]
     * completedAt (timestamp, optional)

🔄 MIGRATION PHASES:

Phase 1: Global Challenge Migration
  - Migrate Challenge table with ID mapping
  - Migrate ChallengeGoal table with competition/country FK validation
  - Create ChallengeGoalTeam junction entries with team FK validation

Phase 2: Career Challenge Migration  
  - Scan all user saves for career challenges
  - Map to global challenges using ID lookup table
  - Create CareerChallenge entries with proper save/game FK references
  - Create CareerChallengeGoal entries based on completion status

🔍 VALIDATION REQUIREMENTS:
  - All competitionId → CompetitionGroup mapping via CompetitionGroupApiCompetition
  - All teamId → Team.id validation (string to integer conversion)
  - All countryId → Country.code validation
  - All gameId → Game.id mapping (fm24 → game table lookup)
  - All challenge.id → global challenge existence validation
  `);
}

async function main() {
  try {
    console.log('🔍 Starting detailed career challenges analysis...');
    
    const careerChallenges = await getDetailedCareerChallengeStructure();
    const references = await validateForeignKeyReferences();
    await analyzePostgreSQLMapping();
    
    console.log('\n✅ Detailed analysis completed!');
    console.log('\n🚀 Ready to proceed with challenge migration implementation');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}