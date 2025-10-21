import { adminDB } from '../../lib/auth/firebase-admin';

export async function analyzeCurrentData() {
  console.log('🔍 Analyzing current database structure...');
  
  try {
    // Count countries with competitions
    const countriesSnapshot = await adminDB.collection('countries').get();
    let totalCountries = 0;
    let totalCompetitions = 0;
    let competitionsWithTeams = 0;
    const competitionsByCountry: Record<string, number> = {};
    
    for (const countryDoc of countriesSnapshot.docs) {
      const countryCode = countryDoc.id;
      totalCountries++;
      
      // Count competitions for this country
      const competitionsSnapshot = await adminDB
        .collection('countries')
        .doc(countryCode)
        .collection('competitions')
        .where('inFootballManager', '==', true)
        .get();
      
      competitionsByCountry[countryCode] = competitionsSnapshot.size;
      totalCompetitions += competitionsSnapshot.size;
      
      // Check which competitions already have teams
      for (const compDoc of competitionsSnapshot.docs) {
        const compData = compDoc.data();
        if (compData.teams && compData.teams.length > 0) {
          competitionsWithTeams++;
        }
      }
    }
    
    // Count existing teams
    const teamsSnapshot = await adminDB.collection('teams').get();
    const totalTeams = teamsSnapshot.size;
    
    // Analyze team distribution by league
    const teamsByLeague: Record<number, number> = {};
    teamsSnapshot.docs.forEach(doc => {
      const team = doc.data();
      const leagueId = team.leagueId;
      teamsByLeague[leagueId] = (teamsByLeague[leagueId] || 0) + 1;
    });
    
    console.log('\n📈 Current Database Stats:');
    console.log(`- Countries: ${totalCountries}`);
    console.log(`- Total Competitions (inFootballManager=true): ${totalCompetitions}`);
    console.log(`- Competitions with teams: ${competitionsWithTeams}`);
    console.log(`- Total Teams: ${totalTeams}`);
    console.log(`- Unique leagues with teams: ${Object.keys(teamsByLeague).length}`);
    
    console.log('\n🌍 Competitions by Country:');
    Object.entries(competitionsByCountry)
      .sort(([,a], [,b]) => b - a)
      .forEach(([country, count]) => {
        console.log(`  ${country}: ${count} competitions`);
      });
    
    console.log('\n⚽ Top Leagues by Team Count:');
    Object.entries(teamsByLeague)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([leagueId, count]) => {
        console.log(`  League ${leagueId}: ${count} teams`);
      });
    
    return {
      totalCountries,
      totalCompetitions,
      competitionsWithTeams,
      totalTeams,
      competitionsByCountry,
      teamsByLeague
    };
    
  } catch (error) {
    console.error('Error analyzing data:', error);
    throw error;
  }
}

if (require.main === module) {
  analyzeCurrentData()
    .then(() => {
      console.log('\n✅ Analysis complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    });
}