import { adminDB } from '../../lib/auth/firebase-admin';
import { fetchFromApi } from '../../lib/apiFootball';
import { Timestamp } from 'firebase-admin/firestore';
import { Save } from '@/lib/types/Save';
import { ApiCompetition } from '@/lib/types/ApiCompetition';

// Daily maintenance within API limits
export async function dailyMaintenance() {
  console.log('🔄 Starting daily maintenance...');
  
  const maxCalls = 50; // Reserve 50 calls for daily maintenance
  let callsUsed = 0;
  
  // Priority 1: Update competitions that users actually use
  const userSaves = await getUserActiveCompetitions();
  const userCompetitions = [...new Set(userSaves.map(save => save.currentLeague?.id).filter(Boolean))];
  
  console.log(`👥 Found ${userCompetitions.length} competitions actively used by users`);
  
  // Priority 2: Update stale team data (older than 30 days)
  const staleCompetitions = await findStaleCompetitions();
  
  // Priority 3: Fill gaps in high-priority leagues
  const priorityCompetitions = await findPriorityCompetitionsWithoutTeams();
  
  // Combine and prioritize
  const updateQueue = [
    ...userCompetitions.map(id => ({ id, priority: 1000, reason: 'User active' })),
    ...staleCompetitions.map(comp => ({ ...comp, priority: 500, reason: 'Stale data' })),
    ...priorityCompetitions.map(comp => ({ ...comp, priority: 100, reason: 'Priority league' }))
  ].sort((a, b) => b.priority - a.priority);
  
  console.log(`📋 Update queue: ${updateQueue.length} competitions`);
  
  for (const item of updateQueue) {
    if (callsUsed >= maxCalls) {
      console.log(`⚠️  Reached daily maintenance limit (${maxCalls} calls)`);
      break;
    }
    
    try {
      console.log(`🔄 Updating: Competition ${item.id} (${item.reason})`);
      
      const teams = await fetchFromApi(`/teams?league=${item.id}&season=2024`);
      callsUsed++;
      
      // Update season data
      await adminDB
        .collection('apiCompetitions')
        .doc(item.id.toString())
        .collection('seasons')
        .doc('2024')
        .set({
          season: 2024,
          teams: teams,
          dataComplete: true,
          totalTeams: teams.length,
          lastUpdated: Timestamp.now()
        });
      
      // Update teams collection
      for (const team of teams) {
        await adminDB
          .collection('teams')
          .doc(team.id.toString())
          .set({
            ...team,
            season: 2024,
            updatedAt: Timestamp.now()
          }, { merge: true });
      }
      
      console.log(`✅ Updated ${teams.length} teams for competition ${item.id}`);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Error updating competition ${item.id}:`, error);
    }
  }
  
  console.log(`📊 Daily maintenance complete. Used ${callsUsed}/${maxCalls} API calls.`);
}

async function getUserActiveCompetitions() {
  const usersSnapshot = await adminDB.collection('users').get();
  const activeSaves: Save[] = [];
  
  for (const userDoc of usersSnapshot.docs) {
    const savesSnapshot = await adminDB
      .collection('users')
      .doc(userDoc.id)
      .collection('saves')
      .get();
    
    savesSnapshot.docs.forEach(saveDoc => {
      const save = saveDoc.data();
      if (save.currentLeague) {
        activeSaves.push(save as Save);
      }
    });
  }
  
  return activeSaves;
}

async function findStaleCompetitions() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const staleCompetitions = [];
  const apiCompetitionsSnapshot = await adminDB.collection('apiCompetitions').get();
  
  for (const doc of apiCompetitionsSnapshot.docs) {
    const comp = doc.data();
    
    // Check if season data is stale
    const seasonDoc = await adminDB
      .collection('apiCompetitions')
      .doc(doc.id)
      .collection('seasons')
      .doc('2024')
      .get();
    
    if (!seasonDoc.exists || 
        seasonDoc.data()?.lastUpdated?.toDate() < thirtyDaysAgo) {
      staleCompetitions.push({
        id: comp.id,
        name: comp.name,
        countryCode: comp.countryCode
      });
    }
  }
  
  return staleCompetitions;
}

async function findPriorityCompetitionsWithoutTeams() {
  // Same logic as strategic migration but focused on current gaps
  const competitions = [];
  const apiCompetitionsSnapshot = await adminDB
    .collection('apiCompetitions')
    .where('inFootballManager', '==', true)
    .get();
  
  for (const doc of apiCompetitionsSnapshot.docs) {
    const comp = doc.data() as ApiCompetition;
    
    // Check if missing 2024 season data
    const seasonDoc = await adminDB
      .collection('apiCompetitions')
      .doc(doc.id)
      .collection('seasons')
      .doc('2024')
      .get();
    
    if (!seasonDoc.exists && isHighPriorityLeague(comp)) {
      competitions.push({
        id: comp.id,
        name: comp.name,
        countryCode: comp.countryCode
      });
    }
  }
  
  return competitions;
}

function isHighPriorityLeague(comp: ApiCompetition): boolean {
  // Top countries
  const topCountries = ['ES', 'EN', 'DE', 'IT', 'FR', 'BR', 'AR', 'NL', 'PT', 'BE'];
  if (!topCountries.includes(comp.countryCode)) return false;
  
  // Only leagues, not cups
  if (comp.type !== 'League') return false;
  
  // Top tier leagues based on name patterns
  const topTierPatterns = [
    'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1',
    'Primera División', 'Primeira Liga', 'Eredivisie', 'Pro League'
  ];
  
  return topTierPatterns.some(pattern => 
    comp.name.toLowerCase().includes(pattern.toLowerCase())
  );
}

if (require.main === module) {
  dailyMaintenance()
    .then(() => {
      console.log('✅ Daily maintenance completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Daily maintenance failed:', error);
      process.exit(1);
    });
}