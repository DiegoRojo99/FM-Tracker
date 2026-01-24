import { adminDB } from '../../lib/auth/firebase-admin';
import { fetchFromApi } from '../../lib/apiFootball';
import { rateLimiter } from '../../lib/utils/rateLimiter';
import { Timestamp } from 'firebase-admin/firestore';
import { Competition } from '@/lib/types/Country&Competition';
import { Team } from '@/lib/types/firebase/Team';

type MissingCompetition = {
  id: number;
  name: string;
  countryCode: string;
  priority: number;
  season: number;
};

// Optimized migration based on actual data analysis
export async function optimizedMigration(targetSeason: number = 2024) {
  console.log(`🚀 Starting optimized migration for season ${targetSeason}...`);
  
  // First, test if target season is available
  console.log('\n🔍 Testing season availability...');
  const seasonAvailable = await testSeasonAvailability(targetSeason);
  
  if (!seasonAvailable) {
    console.log(`⚠️  Season ${targetSeason} not available. Falling back to existing data linking.`);
  }
  
  // Phase 1: Link existing teams to competitions (0 API calls)
  console.log('\n📋 Phase 1: Linking existing teams to competitions...');
  await linkExistingTeamsToCompetitions();
  
  // Phase 2: Identify missing competitions (smart API usage)
  console.log('\n🎯 Phase 2: Finding competitions that need team data...');
  const missingCompetitions = await findCompetitionsNeedingTeams();
  
  // Phase 3: Strategic API calls for missing data (only if season is available)
  if (seasonAvailable) {
    console.log(`\n📡 Phase 3: Fetching teams for missing competitions (season ${targetSeason})...`);
    await fetchTeamsForMissingCompetitions(missingCompetitions, targetSeason);
  } else {
    console.log('\n⏭️  Skipping Phase 3: Target season not available in free tier');
    console.log('💡 Suggestion: Use existing data or manually update key competitions');
  }
  
  console.log('✅ Optimized migration complete!');
}

// Test if a specific season is available in the API
async function testSeasonAvailability(season: number): Promise<boolean> {
  try {
    // Test with Premier League (ID: 39) - always available if season is supported
    console.log(`🔍 Testing season ${season} availability...`);
    const response = await fetchFromApi(`/teams?league=39&season=${season}`);
    const available = response && response.length > 0;
    console.log(`${available ? '✅' : '❌'} Season ${season}: ${available ? 'Available' : 'Not available'}`);
    return available;
  } catch (error) {
    console.error(`❌ Season ${season} test failed:`, error);
    return false;
  }
}

// Phase 1: Link existing 2,324 teams to their competitions
async function linkExistingTeamsToCompetitions(): Promise<void> {
  console.log('📎 Linking existing teams to API competitions...');
  
  // Get all existing teams
  const teamsSnapshot = await adminDB.collection('teams').get();
  console.log(`Found ${teamsSnapshot.size} existing teams`);
  
  // Group teams by leagueId
  const teamsByLeague: Record<number, Team[]> = {};
  teamsSnapshot.docs.forEach(doc => {
    const team = doc.data() as Team;
    const leagueId = team.leagueId;
    if (!teamsByLeague[leagueId]) {
      teamsByLeague[leagueId] = [];
    }
    teamsByLeague[leagueId].push(team);
  });
  
  console.log(`Teams grouped into ${Object.keys(teamsByLeague).length} leagues`);
  
  // Create ApiCompetition records and link teams
  let linkedCompetitions = 0;
  let linkedTeams = 0;
  
  for (const [leagueIdStr, teams] of Object.entries(teamsByLeague)) {
    const leagueId = parseInt(leagueIdStr);
    
    // Find competition info from existing structure
    const competitionInfo = await findCompetitionInfo(leagueId);
    
    if (competitionInfo) {
      // Create ApiCompetition record
      await adminDB
        .collection('apiCompetitions')
        .doc(leagueId.toString())
        .set({
          id: leagueId,
          name: competitionInfo.name,
          logo: competitionInfo.logo || '',
          countryCode: competitionInfo.countryCode,
          countryName: competitionInfo.countryName,
          type: competitionInfo.type || 'League',
          season: teams[0].season || 2023,
          inFootballManager: true,
          apiSource: 'api-sports',
          createdAt: Timestamp.now(),
          lastUpdated: Timestamp.now()
        });
      
      // Create season record with existing teams
      await adminDB
        .collection('apiCompetitions')
        .doc(leagueId.toString())
        .collection('seasons')
        .doc(teams[0].season?.toString() || '2023')
        .set({
          season: teams[0].season || 2023,
          teams: teams,
          dataComplete: true,
          totalTeams: teams.length,
          lastUpdated: Timestamp.now()
        });
      
      linkedCompetitions++;
      linkedTeams += teams.length;
      
      console.log(`✅ Linked ${teams.length} teams to competition: ${competitionInfo.name}`);
    } else {
      console.log(`⚠️  No competition info found for league ${leagueId} (${teams.length} teams)`);
    }
  }
  
  console.log(`\n📊 Phase 1 Results:`);
  console.log(`- Competitions created: ${linkedCompetitions}`);
  console.log(`- Teams linked: ${linkedTeams}`);
}

// Find competition info from existing countries/competitions structure
async function findCompetitionInfo(leagueId: number): Promise<Competition | null> {
  const countriesSnapshot = await adminDB.collection('countries').get();
  
  for (const countryDoc of countriesSnapshot.docs) {
    const competitionsSnapshot = await adminDB
      .collection('countries')
      .doc(countryDoc.id)
      .collection('competitions')
      .where('id', '==', leagueId)
      .get();
    
    if (!competitionsSnapshot.empty) {
      const compData = competitionsSnapshot.docs[0].data() as Competition;
      return {
        ...compData,
        countryCode: countryDoc.id
      };
    }
  }
  
  return null;
}

// Phase 2: Find competitions that still need team data
async function findCompetitionsNeedingTeams() {
  console.log('🔍 Finding competitions that need team data...');
  
  const missingCompetitions: MissingCompetition[] = [];
  const countriesSnapshot = await adminDB.collection('countries').get();
  
  for (const countryDoc of countriesSnapshot.docs) {
    const competitionsSnapshot = await adminDB
      .collection('countries')
      .doc(countryDoc.id)
      .collection('competitions')
      .where('inFootballManager', '==', true)
      .get();
    
    for (const compDoc of competitionsSnapshot.docs) {
      const comp = compDoc.data() as Competition;
      
      // Check if this competition already has teams in apiCompetitions
      const apiCompDoc = await adminDB
        .collection('apiCompetitions')
        .doc(comp.id.toString())
        .get();
      
      if (!apiCompDoc.exists && !isCupCompetition(comp.name)) {
        // This competition needs team data from API (only leagues, not cups)
        let priority = 0;
        
        // Priority calculation
        if (isTopTierLeague(comp.name)) priority += 500;
        if (['GB-ENG', 'ES', 'DE', 'IT', 'FR', 'BR', 'AR', 'NL', 'PT'].includes(countryDoc.id)) priority += 100;
        if (comp.type === 'League') priority += 50;
        
        missingCompetitions.push({
          id: comp.id,
          name: comp.name,
          countryCode: countryDoc.id,
          priority,
          season: comp.season || 2023
        });
      }
    }
  }
  
  // Sort by priority
  missingCompetitions.sort((a, b) => b.priority - a.priority);
  
  console.log(`Found ${missingCompetitions.length} competitions needing team data`);
  console.log('\n🎯 Top priorities:');
  missingCompetitions.slice(0, 10).forEach((comp, index) => {
    console.log(`  ${index + 1}. ${comp.name} (${comp.countryCode}) - Priority: ${comp.priority}`);
  });
  
  return missingCompetitions;
}

function isTopTierLeague(name: string): boolean {
  const topTierPatterns = [
    'Premier League', 'Championship', 'League One', 'League Two', // England
    'La Liga', 'Segunda División', 'Primera RFEF', 'Segunda RFEF', // Spain  
    'Serie A', 'Serie B', 'Serie C', // Italy
    'Bundesliga', '2. Bundesliga', '3. Liga', // Germany
    'Ligue 1', 'Ligue 2', // France
    'Primeira Liga', 'Liga Portugal 2', // Portugal
    'Eredivisie', 'Eerste Divisie', // Netherlands
    'Série A', 'Série B', // Brazil
    'Primera División', 'Primera B', // Argentina
    'Pro League', // Belgium
    'Allsvenskan', 'Superettan' // Sweden
  ];
  
  return topTierPatterns.some(pattern => 
    name.toLowerCase().includes(pattern.toLowerCase())
  );
}

function isCupCompetition(name: string): boolean {
  const cupPatterns = [
    'cup', 'copa', 'coupe', 'pokal', 'coppa', 'supercup', 'super cup',
    'champions', 'uefa', 'euro', 'world cup', 'confederations',
    'fa cup', 'dfb pokal', 'copa del rey', 'coupe de france',
    'coppa italia', 'copa do brasil', 'copa libertadores',
    'trophée', 'trophy', 'shield', 'charity', 'community',
    'playoffs', 'play-off', 'qualification', 'quali'
  ];
  
  const nameLower = name.toLowerCase();
  return cupPatterns.some(pattern => nameLower.includes(pattern));
}

// Phase 3: Strategic API calls for missing competitions
async function fetchTeamsForMissingCompetitions(missingCompetitions: MissingCompetition[], targetSeason: number = 2024) {
  const maxApiCalls = 80; // Reserve calls for daily operations
  let apiCallsUsed = 0;
  
  console.log(`🎯 Processing up to ${maxApiCalls} competitions with rate limiting...`);
  console.log(`⚡ Rate limits: 9 calls/minute, 95 calls/day`);
  
  for (const comp of missingCompetitions) {
    // Check rate limits
    if (!rateLimiter.canMakeCall()) {
      const remaining = rateLimiter.getRemainingCalls();
      console.log(`\n⚠️  Rate limit reached:`);
      console.log(`   Daily: ${remaining.daily} calls remaining`);
      console.log(`   Minute: ${remaining.minute} calls remaining this minute`);
      
      if (remaining.daily === 0) {
        console.log(`📊 Daily limit reached. Processed ${apiCallsUsed} competitions.`);
        break;
      }
      // If minute limit reached, fetchFromApi will handle the waiting
    }
    
    if (apiCallsUsed >= maxApiCalls) {
      console.log(`\n⚠️  Reached migration session limit (${maxApiCalls} calls)`);
      console.log(`📊 Processed ${apiCallsUsed} competitions`);
      console.log(`📈 Remaining competitions: ${missingCompetitions.length - apiCallsUsed}`);
      break;
    }
    
    try {
      const remaining = rateLimiter.getRemainingCalls();
      console.log(`\n📡 [${apiCallsUsed + 1}/${maxApiCalls}] Fetching: ${comp.name} (${comp.countryCode})`);
      console.log(`   Remaining today: ${remaining.daily}, this minute: ${remaining.minute}`);
      
      // Make API call (rateLimiter handles waiting automatically)
      const teams = await fetchFromApi(`/teams?league=${comp.id}&season=${targetSeason}`);
      apiCallsUsed++;
      
      if (teams && teams.length > 0) {
        // Create ApiCompetition record
        await adminDB
          .collection('apiCompetitions')
          .doc(comp.id.toString())
          .set({
            id: comp.id,
            name: comp.name,
            logo: '', // Will be filled when available
            countryCode: comp.countryCode,
            countryName: comp.countryCode, // Update this with proper country name
            type: 'League',
            season: targetSeason,
            inFootballManager: true,
            apiSource: 'api-sports',
            createdAt: Timestamp.now(),
            lastUpdated: Timestamp.now()
          });
        
        // Create season record
        await adminDB
          .collection('apiCompetitions')
          .doc(comp.id.toString())
          .collection('seasons')
          .doc(targetSeason.toString())
          .set({
            season: targetSeason,
            teams: teams,
            dataComplete: true,
            totalTeams: teams.length,
            lastUpdated: Timestamp.now()
          });
        
        // Update teams collection
        for (const team of teams) {
          if (team?.team?.id) {
            await adminDB
              .collection('teams')
              .doc(team.team.id.toString())
              .set({
                ...team.team,
                venue: team.venue,
                updatedAt: Timestamp.now()
              }, { merge: true });
          }
        }
        
        console.log(`✅ Added ${teams.length} teams for ${comp.name}`);
      } else {
        console.log(`⚠️  No teams found for ${comp.name}`);
      }
      
      // Small buffer between requests (rate limiter handles main timing)
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ Error fetching ${comp.name}:`, error);
      // Continue with next competition
    }
  }
  
  const finalRemaining = rateLimiter.getRemainingCalls();
  console.log(`\n📊 Phase 3 Results:`);
  console.log(`- API calls used this session: ${apiCallsUsed}/${maxApiCalls}`);
  console.log(`- Competitions processed: ${apiCallsUsed}`);
  console.log(`- Remaining today: ${finalRemaining.daily} calls`);
  console.log(`- Remaining competitions: ${Math.max(0, missingCompetitions.length - apiCallsUsed)}`);
  
  if (missingCompetitions.length > apiCallsUsed) {
    console.log(`\n💡 To continue tomorrow, run the same command again.`);
  }
}

if (require.main === module) {
  // Allow season parameter from command line
  const targetSeason = process.argv[2] ? parseInt(process.argv[2]) : 2024;
  
  optimizedMigration(targetSeason)
    .then(() => {
      console.log('\n🎉 Optimized migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}