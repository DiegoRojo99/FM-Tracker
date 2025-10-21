import { fetchFromApi } from '../../lib/apiFootball';
import { adminDB } from '../../lib/auth/firebase-admin';
import { ApiCompetition, ApiCompetitionSeason } from '../../lib/types/ApiCompetition.d';
import { Timestamp } from 'firebase-admin/firestore';

// API call tracking to stay within 100/day limit
const MAX_DAILY_CALLS = 95; // Leave buffer for other operations

export class ApiRateLimiter {
  private callCount = 0;
  private lastResetDate = new Date().toDateString();
  
  canMakeCall(): boolean {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.callCount = 0;
      this.lastResetDate = today;
    }
    
    return this.callCount < MAX_DAILY_CALLS;
  }
  
  recordCall(): void {
    this.callCount++;
    console.log(`📡 API Call ${this.callCount}/${MAX_DAILY_CALLS} made today`);
  }
  
  getRemainingCalls(): number {
    return MAX_DAILY_CALLS - this.callCount;
  }
}

const rateLimiter = new ApiRateLimiter();

// Priority-based migration strategy
export async function strategicMigration() {
  console.log('🚀 Starting strategic API migration...');
  
  // Phase 1: Migrate existing data structure (0 API calls)
  console.log('\n📋 Phase 1: Migrating existing competitions to ApiCompetitions...');
  await migrateExistingCompetitions();
  
  // Phase 2: Identify priority competitions for team data
  console.log('\n🎯 Phase 2: Identifying priority competitions...');
  const priorityCompetitions = await identifyPriorityCompetitions();
  
  // Phase 3: Strategic API calls for team data
  console.log('\n📡 Phase 3: Strategic API calls for teams...');
  await fetchTeamsForPriorityCompetitions(priorityCompetitions);
  
  console.log('✅ Strategic migration complete!');
}

// Migrate existing competition structure without API calls
async function migrateExistingCompetitions(): Promise<void> {
  const countriesSnapshot = await adminDB.collection('countries').get();
  
  for (const countryDoc of countriesSnapshot.docs) {
    const countryCode = countryDoc.id;
    const competitionsSnapshot = await adminDB
      .collection('countries')
      .doc(countryCode)
      .collection('competitions')
      .where('inFootballManager', '==', true)
      .get();
    
    for (const compDoc of competitionsSnapshot.docs) {
      const compData = compDoc.data();
      
      // Create ApiCompetition record
      const apiCompetition: Omit<ApiCompetition, 'lastUpdated' | 'createdAt'> = {
        id: compData.id,
        name: compData.name,
        logo: compData.logo,
        countryCode: compData.countryCode,
        countryName: compData.countryName,
        type: compData.type,
        season: compData.season || 2023,
        inFootballManager: true,
        apiSource: 'api-sports'
      };
      
      // Store in new apiCompetitions collection
      await adminDB
        .collection('apiCompetitions')
        .doc(compData.id.toString())
        .set({
          ...apiCompetition,
          createdAt: Timestamp.now(),
          lastUpdated: Timestamp.now()
        });
      
      console.log(`✅ Migrated competition: ${compData.name} (${countryCode})`);
    }
  }
}

// Identify which competitions should get team data first
async function identifyPriorityCompetitions(): Promise<Array<{id: number, priority: number, name: string, countryCode: string}>> {
  const competitions: Array<{id: number, priority: number, name: string, countryCode: string}> = [];
  
  // Get existing teams to see which leagues are already populated
  const teamsSnapshot = await adminDB.collection('teams').get();
  const teamsByLeague: Record<number, number> = {};
  
  teamsSnapshot.docs.forEach(doc => {
    const team = doc.data();
    teamsByLeague[team.leagueId] = (teamsByLeague[team.leagueId] || 0) + 1;
  });
  
  // Get all API competitions
  const apiCompetitionsSnapshot = await adminDB.collection('apiCompetitions').get();
  
  for (const doc of apiCompetitionsSnapshot.docs) {
    const comp = doc.data();
    let priority = 0;
    
    // Priority criteria (higher = more important)
    // 1. Already has teams (highest priority to update)
    if (teamsByLeague[comp.id]) {
      priority += 1000 + teamsByLeague[comp.id];
    }
    
    // 2. Top-tier leagues (based on name patterns)
    if (isTopTierLeague(comp.name)) {
      priority += 500;
    }
    
    // 3. Major countries
    if (['ES', 'EN', 'DE', 'IT', 'FR', 'BR', 'AR'].includes(comp.countryCode)) {
      priority += 100;
    }
    
    // 4. Leagues (over cups)
    if (comp.type === 'League') {
      priority += 50;
    }
    
    competitions.push({
      id: comp.id,
      priority,
      name: comp.name,
      countryCode: comp.countryCode
    });
  }
  
  // Sort by priority (highest first)
  return competitions.sort((a, b) => b.priority - a.priority);
}

function isTopTierLeague(name: string): boolean {
  const topTierPatterns = [
    'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1',
    'Primera División', 'Primeira Liga', 'Eredivisie', 'Liga MX',
    // Add more patterns as needed
  ];
  
  return topTierPatterns.some(pattern => 
    name.toLowerCase().includes(pattern.toLowerCase())
  );
}

// Fetch teams for priority competitions within API limits
async function fetchTeamsForPriorityCompetitions(
  priorityCompetitions: Array<{id: number, priority: number, name: string, countryCode: string}>
): Promise<void> {
  console.log(`\n🎯 Processing ${priorityCompetitions.length} competitions by priority...`);
  
  for (const comp of priorityCompetitions) {
    if (!rateLimiter.canMakeCall()) {
      console.log(`\n⚠️  Reached daily API limit (${MAX_DAILY_CALLS} calls)`);
      console.log(`📊 Processed competitions up to: ${comp.name} (${comp.countryCode})`);
      console.log(`📈 Priority score: ${comp.priority}`);
      break;
    }
    
    try {
      console.log(`\n📡 Fetching teams for: ${comp.name} (Priority: ${comp.priority})`);
      
      // Make API call for teams
      const teams = await fetchFromApi(`/teams?league=${comp.id}&season=2023`);
      rateLimiter.recordCall();
      
      // Store teams in ApiCompetitionSeason
      const seasonData: Omit<ApiCompetitionSeason, 'lastUpdated'> = {
        season: 2023,
        teams: teams,
        dataComplete: true,
        totalTeams: teams.length
      };
      
      await adminDB
        .collection('apiCompetitions')
        .doc(comp.id.toString())
        .collection('seasons')
        .doc('2023')
        .set({
          ...seasonData,
          lastUpdated: Timestamp.now()
        });
      
      // Update teams collection
      for (const team of teams) {
        await adminDB
          .collection('teams')
          .doc(team.id.toString())
          .set({
            ...team,
            updatedAt: Timestamp.now()
          }, { merge: true });
      }
      
      console.log(`✅ Fetched ${teams.length} teams for ${comp.name}`);
      
      // Small delay to be respectful to API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Error fetching teams for ${comp.name}:`, error);
      // Continue with next competition
    }
  }
  
  console.log(`\n📊 Migration Summary:`);
  console.log(`- API calls used: ${rateLimiter.getRemainingCalls()} remaining today`);
  console.log(`- Can continue tomorrow with remaining competitions`);
}

// Function to continue migration over multiple days
export async function continueMigration(): Promise<void> {
  console.log('🔄 Continuing migration from where we left off...');
  
  // Find competitions without team data
  const competitionsNeedingTeams = await findCompetitionsWithoutTeams();
  
  if (competitionsNeedingTeams.length === 0) {
    console.log('✅ All priority competitions already have team data!');
    return;
  }
  
  await fetchTeamsForPriorityCompetitions(competitionsNeedingTeams);
}

async function findCompetitionsWithoutTeams() {
  const competitions: Array<{id: number, priority: number, name: string, countryCode: string}> = [];
  
  const apiCompetitionsSnapshot = await adminDB.collection('apiCompetitions').get();
  
  for (const doc of apiCompetitionsSnapshot.docs) {
    const comp = doc.data();
    
    // Check if this competition has season data
    const seasonDoc = await adminDB
      .collection('apiCompetitions')
      .doc(doc.id)
      .collection('seasons')
      .doc('2023')
      .get();
    
    if (!seasonDoc.exists) {
      // Calculate priority (same logic as before)
      let priority = 0;
      if (isTopTierLeague(comp.name)) priority += 500;
      if (['ES', 'EN', 'DE', 'IT', 'FR', 'BR', 'AR'].includes(comp.countryCode)) priority += 100;
      if (comp.type === 'League') priority += 50;
      
      competitions.push({
        id: comp.id,
        priority,
        name: comp.name,
        countryCode: comp.countryCode
      });
    }
  }
  
  return competitions.sort((a, b) => b.priority - a.priority);
}

if (require.main === module) {
  strategicMigration()
    .then(() => {
      console.log('\n✅ Strategic migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}