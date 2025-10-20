import { fetchFromApi } from '../../lib/apiFootball';
import { rateLimiter } from '../../lib/utils/rateLimiter';

// Test API season availability within free tier limits
export async function testSeasonAvailability() {
  console.log('🔍 Testing API season availability with rate limiting...');
  
  // Test a known major league (Premier League ID: 39) for different seasons
  const testLeagueId = 39; // Premier League
  const seasonsToTest = [2025, 2024, 2023, 2022];
  
  const availableSeasons = [];
  const unavailableSeasons = [];
  
  for (const season of seasonsToTest) {
    try {
      console.log(`\n📡 Testing season ${season}...`);
      
      const remaining = rateLimiter.getRemainingCalls();
      console.log(`Rate limit status: ${remaining.minute}/9 this minute, ${remaining.daily}/95 today`);
      
      const response = await fetchFromApi(`/teams?league=${testLeagueId}&season=${season}`);
      
      if (response && response.length > 0) {
        availableSeasons.push(season);
        console.log(`✅ Season ${season}: ${response.length} teams found`);
      } else {
        unavailableSeasons.push(season);
        console.log(`❌ Season ${season}: No data available`);
      }
      
    } catch (error) {
      unavailableSeasons.push(season);
      console.error(`❌ Season ${season}: Error - ${error}`);
    }
  }
  
  console.log('\n📊 Season Availability Results:');
  console.log(`✅ Available seasons: ${availableSeasons.join(', ')}`);
  console.log(`❌ Unavailable seasons: ${unavailableSeasons.join(', ')}`);
  
  // Recommend strategy based on results
  if (availableSeasons.includes(2025)) {
    console.log('\n🎯 RECOMMENDATION: Use season 2025 for FM26 compatibility');
  } else if (availableSeasons.includes(2024)) {
    console.log('\n🎯 RECOMMENDATION: Use season 2024 as current baseline');
  } else {
    console.log('\n🎯 RECOMMENDATION: Stick with season 2023 (your current data)');
  }
  
  const finalRemaining = rateLimiter.getRemainingCalls();
  console.log(`\n⚡ API calls remaining: ${finalRemaining.daily} today, ${finalRemaining.minute} this minute`);
  
  return {
    availableSeasons,
    unavailableSeasons,
    recommendedSeason: availableSeasons.includes(2025) ? 2025 : 
                      availableSeasons.includes(2024) ? 2024 : 2023
  };
}

if (require.main === module) {
  testSeasonAvailability()
    .then((result) => {
      console.log(`\n✅ Season testing complete. Recommended: ${result.recommendedSeason}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Season testing failed:', error);
      process.exit(1);
    });
}