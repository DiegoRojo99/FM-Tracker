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

async function analyzeSeasonCompetitionData() {
  console.log('🔍 Analyzing season competition data structure...\n');

  try {
    // Get a few saves to analyze their season competition data
    const savesSnapshot = await firestore.collection('users').doc('tgXQqKofRIUMtNHpMyuAwdmSKdS2').collection('saves').limit(3).get();
    
    for (const saveDoc of savesSnapshot.docs) {
      const saveData = saveDoc.data();
      console.log(`📁 Save: ${saveData.teamName} (${saveDoc.id})`);
      
      // Get seasons for this save
      const seasonsSnapshot = await firestore
        .collection('users')
        .doc('tgXQqKofRIUMtNHpMyuAwdmSKdS2')
        .collection('saves')
        .doc(saveDoc.id)
        .collection('seasons')
        .limit(2)
        .get();

      for (const seasonDoc of seasonsSnapshot.docs) {
        const seasonData = seasonDoc.data();
        console.log(`\n  📅 Season: ${seasonData.season}`);
        
        // Analyze cup results
        if (seasonData.cupResults && seasonData.cupResults.length > 0) {
          console.log(`    🏆 Cup Results (${seasonData.cupResults.length}):`);
          seasonData.cupResults.slice(0, 3).forEach((cup: any, index: number) => {
            console.log(`      ${index + 1}. ${cup.name || 'Unknown Cup'}: ${cup.reachedRound || 'Unknown round'}`);
            if (cup.competitionId) {
              console.log(`         Competition ID: ${cup.competitionId}`);
            }
          });
        }

        // Analyze league result
        if (seasonData.leagueResult) {
          console.log(`    🏅 League Result:`);
          console.log(`      Position: ${seasonData.leagueResult.position}`);
          console.log(`      Competition: ${seasonData.leagueResult.competitionName || 'Unknown'}`);
          if (seasonData.leagueResult.competitionId) {
            console.log(`      Competition ID: ${seasonData.leagueResult.competitionId}`);
          }
        }
      }
    }

  } catch (error) {
    console.error('Error analyzing season data:', error);
  } finally {
    process.exit(0);
  }
}

analyzeSeasonCompetitionData();