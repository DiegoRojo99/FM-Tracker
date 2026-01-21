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

interface FirestoreChallenge {
  id: string;
  name: string;
  description: string;
  goals: Array<{
    id: string;
    description: string;
    competitionId?: string;
    teamGroup?: string[];
    countryId?: string;
  }>;
  bonus?: string;
}

interface FirestoreCareerChallenge {
  id: string;
  name: string;
  description: string;
  goals: Array<{
    id: string;
    description: string;
    competitionId?: string;
    teamGroup?: string[];
    countryId?: string;
  }>;
  completedGoals: string[];
  startedAt: string;
  completedAt?: string;
  gameId: string;
}

async function analyzeGlobalChallenges() {
  console.log('\n=== GLOBAL CHALLENGES ANALYSIS ===');
  
  const challengesSnapshot = await db.collection('challenges').get();
  const challenges = challengesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as FirestoreChallenge[];

  console.log(`📊 Total challenges: ${challenges.length}`);
  
  if (challenges.length > 0) {
    // Analyze structure
    const firstChallenge = challenges[0];
    console.log(`\n📄 Sample challenge structure:`);
    console.log(JSON.stringify(firstChallenge, null, 2));

    // Analyze goals
    const totalGoals = challenges.reduce((sum, c) => sum + (c.goals?.length || 0), 0);
    console.log(`\n🎯 Total goals across all challenges: ${totalGoals}`);
    
    const goalTypes = {
      competition: 0,
      team: 0,
      country: 0,
      other: 0
    };

    const competitionIds = new Set<string>();
    const teamIds = new Set<string>();
    const countryIds = new Set<string>();

    challenges.forEach(challenge => {
      challenge.goals?.forEach(goal => {
        if (goal.competitionId) {
          goalTypes.competition++;
          competitionIds.add(goal.competitionId);
        }
        if (goal.teamGroup && goal.teamGroup.length > 0) {
          goalTypes.team++;
          goal.teamGroup.forEach(teamId => teamIds.add(teamId));
        }
        if (goal.countryId) {
          goalTypes.country++;
          countryIds.add(goal.countryId);
        }
        if (!goal.competitionId && !goal.teamGroup && !goal.countryId) {
          goalTypes.other++;
        }
      });
    });

    console.log(`\n📋 Goal types breakdown:`);
    console.log(`  Competition-based: ${goalTypes.competition}`);
    console.log(`  Team-based: ${goalTypes.team}`);
    console.log(`  Country-based: ${goalTypes.country}`);
    console.log(`  Other: ${goalTypes.other}`);

    console.log(`\n🔗 Referenced entities:`);
    console.log(`  Unique competition IDs: ${competitionIds.size}`);
    console.log(`  Unique team IDs: ${teamIds.size}`);
    console.log(`  Unique country IDs: ${countryIds.size}`);

    if (competitionIds.size > 0) {
      console.log(`\n🏆 Sample competition IDs:`, Array.from(competitionIds).slice(0, 5));
    }
    if (teamIds.size > 0) {
      console.log(`🏈 Sample team IDs:`, Array.from(teamIds).slice(0, 5));
    }
    if (countryIds.size > 0) {
      console.log(`🌍 Sample country IDs:`, Array.from(countryIds).slice(0, 5));
    }
  }

  return challenges;
}

async function analyzeCareerChallenges() {
  console.log('\n=== CAREER CHALLENGES ANALYSIS ===');
  
  let totalCareerChallenges = 0;
  let totalUsersWithChallenges = 0;
  let totalSavesWithChallenges = 0;
  const gameIds = new Set<string>();
  const challengeIds = new Set<string>();
  const completionStats = {
    completed: 0,
    inProgress: 0,
    notStarted: 0
  };

  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    console.log(`👥 Scanning ${usersSnapshot.docs.length} users...`);

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      let userHasChallenges = false;
      
      try {
        // Get saves for this user
        const savesSnapshot = await db.collection('users').doc(userId).collection('saves').get();
        
        for (const saveDoc of savesSnapshot.docs) {
          const saveId = saveDoc.id;
          let saveHasChallenges = false;
          
          try {
            // Get challenges for this save
            const challengesSnapshot = await db
              .collection('users').doc(userId)
              .collection('saves').doc(saveId)
              .collection('challenges').get();
            
            if (challengesSnapshot.docs.length > 0) {
              saveHasChallenges = true;
              userHasChallenges = true;
              totalCareerChallenges += challengesSnapshot.docs.length;
              
              challengesSnapshot.docs.forEach(challengeDoc => {
                const challenge = challengeDoc.data() as FirestoreCareerChallenge;
                
                if (challenge.id) challengeIds.add(challenge.id);
                if (challenge.gameId) gameIds.add(challenge.gameId);
                
                if (challenge.completedAt) {
                  completionStats.completed++;
                } else if (challenge.completedGoals && challenge.completedGoals.length > 0) {
                  completionStats.inProgress++;
                } else {
                  completionStats.notStarted++;
                }
              });
            }
          } catch (error) {
            // Skip saves that cause errors
            continue;
          }
          
          if (saveHasChallenges) {
            totalSavesWithChallenges++;
          }
        }
      } catch (error) {
        // Skip users that cause errors
        continue;
      }
      
      if (userHasChallenges) {
        totalUsersWithChallenges++;
      }
    }
  } catch (error) {
    console.error('❌ Error analyzing career challenges:', error);
  }

  console.log(`📊 Career challenges summary:`);
  console.log(`  Total career challenges: ${totalCareerChallenges}`);
  console.log(`  Users with challenges: ${totalUsersWithChallenges}`);
  console.log(`  Saves with challenges: ${totalSavesWithChallenges}`);
  console.log(`  Unique challenge template IDs: ${challengeIds.size}`);
  console.log(`  Game IDs found: ${Array.from(gameIds).join(', ')}`);
  
  console.log(`\n🏁 Completion status:`);
  console.log(`  Completed: ${completionStats.completed}`);
  console.log(`  In Progress: ${completionStats.inProgress}`);
  console.log(`  Not Started: ${completionStats.notStarted}`);

  return {
    totalCareerChallenges,
    totalUsersWithChallenges,
    totalSavesWithChallenges,
    challengeIds: Array.from(challengeIds),
    gameIds: Array.from(gameIds),
    completionStats
  };
}

async function validateChallengeRelationships(globalChallenges: FirestoreChallenge[], careerAnalysis: any) {
  console.log('\n=== RELATIONSHIP VALIDATION ===');
  
  const globalChallengeIds = new Set(globalChallenges.map(c => c.id));
  const careerChallengeIds = new Set(careerAnalysis.challengeIds);
  
  const orphanedCareerChallenges = careerAnalysis.challengeIds.filter((id: string) => 
    !globalChallengeIds.has(id)
  );
  
  const unusedGlobalChallenges = globalChallenges.filter(c => 
    !careerChallengeIds.has(c.id)
  );

  console.log(`🔗 Relationship analysis:`);
  console.log(`  Global challenges: ${globalChallengeIds.size}`);
  console.log(`  Career challenge template IDs: ${careerChallengeIds.size}`);
  console.log(`  Orphaned career challenges: ${orphanedCareerChallenges.length}`);
  console.log(`  Unused global challenges: ${unusedGlobalChallenges.length}`);

  if (orphanedCareerChallenges.length > 0) {
    console.log(`⚠️  Orphaned career challenge IDs:`, orphanedCareerChallenges.slice(0, 5));
  }
}

async function main() {
  try {
    console.log('🔍 Starting challenges data analysis...');
    
    const globalChallenges = await analyzeGlobalChallenges();
    const careerAnalysis = await analyzeCareerChallenges();
    await validateChallengeRelationships(globalChallenges, careerAnalysis);
    
    console.log('\n✅ Analysis completed!');
    console.log('\n📋 Migration Planning Notes:');
    console.log('1. Global challenges need ID mapping (Firestore doc ID → PostgreSQL auto-increment)');
    console.log('2. Challenge goals need separate table with foreign keys to challenges');
    console.log('3. Career challenges reference global challenge IDs - need mapping table');
    console.log('4. Team/competition/country references need validation against migrated tables');
    console.log('5. Game IDs need mapping to Game table foreign keys');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}