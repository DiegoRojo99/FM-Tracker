import { adminDB } from '../../lib/auth/firebase-admin';
import { fetchFromApi } from '../../lib/apiFootball';
import { rateLimiter } from '../../lib/utils/rateLimiter';
import { Timestamp } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

type MissingCompetition = {
  id: string;
  name: string;
  countryCode: string;
  priority: number;
  season: number;
};

// Fetch 2025 season data for missing competitions
export async function fetch2025Data() {
  console.log(`🚀 Fetching 2025 season data for competitions...`);
  
  // First, test if 2025 season is available
  console.log('\n🔍 Testing 2025 season availability...');
  const seasonAvailable = await testSeasonAvailability(2025);
  
  if (!seasonAvailable) {
    console.log(`❌ Season 2025 not available. Exiting.`);
    return;
  }
  
  // Find competitions that need 2025 data
  console.log('\n🎯 Finding competitions that need 2025 team data...');
  const missingCompetitions = await findCompetitionsNeedingTeams();
  
  // Fetch teams for missing competitions
  console.log(`\n📡 Fetching teams for missing competitions (season 2025)...`);
  await fetchTeamsForMissingCompetitions(missingCompetitions, 2025);
  
  console.log('✅ 2025 data fetch complete!');
}

// Test if 2025 season is available in the API
async function testSeasonAvailability(season: number): Promise<boolean> {
  try {
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

// Find competitions that still need team data (excluding cups)
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
      const comp = compDoc.data();
      
      // Skip cup competitions
      if (isCupCompetition(comp.name)) {
        continue;
      }
      
      // Check if this competition already has 2025 season data
      const apiCompDoc = await adminDB
        .collection('apiCompetitions')
        .doc(comp.id.toString())
        .get();
      
      if (apiCompDoc.exists) {
        // Check if it has 2025 season data
        const season2025Doc = await adminDB
          .collection('apiCompetitions')
          .doc(comp.id.toString())
          .collection('seasons')
          .doc('2025')
          .get();
        
        if (!season2025Doc.exists) {
          // This competition exists but needs 2025 data
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
            season: 2025
          });
        }
      } else {
        // Competition doesn't exist at all, add it
        let priority = 0;
        
        if (isTopTierLeague(comp.name)) priority += 500;
        if (['GB-ENG', 'ES', 'DE', 'IT', 'FR', 'BR', 'AR', 'NL', 'PT'].includes(countryDoc.id)) priority += 100;
        if (comp.type === 'League') priority += 50;
        
        missingCompetitions.push({
          id: comp.id,
          name: comp.name,
          countryCode: countryDoc.id,
          priority,
          season: 2025
        });
      }
    }
  }
  
  // Sort by priority
  missingCompetitions.sort((a, b) => b.priority - a.priority);
  
  console.log(`Found ${missingCompetitions.length} competitions needing 2025 team data`);
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

// Fetch teams for missing competitions
async function fetchTeamsForMissingCompetitions(missingCompetitions: MissingCompetition[], targetSeason: number = 2025) {
  const maxApiCalls = Math.min(500, missingCompetitions.length); // Process many more with Pro subscription
  let apiCallsUsed = 0;
  
  console.log(`🎯 Processing up to ${maxApiCalls} competitions with Pro subscription rate limits...`);
  console.log(`⚡ Rate limits: ~100 calls/minute, 7500 calls/day (Pro subscription)`);
  
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
      console.log(`\n⚠️  Reached session limit (${maxApiCalls} calls)`);
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
        // Create or update ApiCompetition record
        const competitionRef = adminDB.collection('apiCompetitions').doc(comp.id.toString());
        const competitionDoc = await competitionRef.get();
        
        if (!competitionDoc.exists) {
          // Create new competition
          await competitionRef.set({
            id: comp.id,
            name: comp.name,
            logo: '', // Will be filled when available
            countryCode: comp.countryCode,
            countryName: comp.countryCode,
            type: 'League',
            season: targetSeason,
            inFootballManager: true,
            apiSource: 'api-sports',
            createdAt: Timestamp.now(),
            lastUpdated: Timestamp.now()
          });
        }
        
        // Create 2025 season record
        await competitionRef
          .collection('seasons')
          .doc(targetSeason.toString())
          .set({
            season: targetSeason,
            teams: teams,
            dataComplete: true,
            totalTeams: teams.length,
            lastUpdated: Timestamp.now()
          });
        
        // Update teams collection with 2025 data
        for (const team of teams) {
          if (team?.team?.id) {
            await adminDB
              .collection('teams')
              .doc(team.team.id.toString())
              .set({
                ...team.team,
                venue: team.venue,
                season: targetSeason,
                leagueId: comp.id,
                updatedAt: Timestamp.now()
              }, { merge: true });
          }
        }
        
        console.log(`✅ Added ${teams.length} teams for ${comp.name} (2025 season)`);
      } else {
        console.log(`⚠️  No teams found for ${comp.name} in 2025`);
      }
      
      // Small buffer between requests (minimal with Pro subscription)
      await new Promise(resolve => setTimeout(resolve, 50));
      
    } catch (error) {
      console.error(`❌ Error fetching ${comp.name}:`, error);
      // Continue with next competition
    }
  }
  
  const finalRemaining = rateLimiter.getRemainingCalls();
  console.log(`\n📊 2025 Data Fetch Results:`);
  console.log(`- API calls used this session: ${apiCallsUsed}/${maxApiCalls}`);
  console.log(`- Competitions processed: ${apiCallsUsed}`);
  console.log(`- Remaining today: ${finalRemaining.daily} calls`);
  console.log(`- Remaining competitions: ${Math.max(0, missingCompetitions.length - apiCallsUsed)}`);
  
  if (missingCompetitions.length > apiCallsUsed) {
    console.log(`\n💡 To continue, run the script again.`);
  }
}

if (require.main === module) {
  fetch2025Data()
    .then(() => {
      console.log('\n🎉 2025 data fetch completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 2025 data fetch failed:', error);
      process.exit(1);
    });
}