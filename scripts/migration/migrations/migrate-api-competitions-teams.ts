import { Pool } from 'pg';
import { countryNameMapping } from './migrate-teams';

export async function migrateApiCompetitionsTeams(firestore: any, pool: Pool): Promise<void> {
  console.log('\n🏆 Starting ApiCompetition migration...');
  
  try {
    // Fetch all apiCompetitions from Firestore
    console.log('📥 Fetching apiCompetitions from Firestore...');
    const snapshot = await firestore.collection('apiCompetitions').get();
    const competitionIds = snapshot.docs.map((doc: any) => parseInt(doc.id));

    console.log(`Found ${competitionIds.length} API competitions to migrate`);

    if (competitionIds.length === 0) {
      console.log('⏭️  No API competitions found, skipping migration');
      return;
    }

    // Fetch already linked teams to avoid duplicates
    const existingTeamsRes = await pool.query('SELECT DISTINCT "teamId" FROM "TeamSeason"');
    const existingTeams = existingTeamsRes.rows.map((row: any) => row.teamId);
    const existingTeamsSet = new Set(existingTeams);

    let teamsSuccessful = 0;
    let teamsCreated = 0;
    let teamsFailed = 0;
    let teamsFailedCountries: string[] = [];
    let teamsSkipped = 0;

    for (const competitionId of competitionIds) {
      try {
        // Fetch teams for this competition from Firestore subcollection
        const seasonsSnapshot = await firestore
          .collection('apiCompetitions')
          .doc(competitionId.toString())
          .collection('seasons')
          .get();
          
        for (const seasonDoc of seasonsSnapshot.docs) {
          const seasonData = seasonDoc.data();
          const teams = seasonData.teams;

          await Promise.all(teams.map(async (team: any) => {
            try {
              if (!team.id && !team.team) {
                console.warn(`     ⚠️  Team data missing ID, skipping:`, team);
                return;
              }

              // Handle nested team object
              if (!team.id) team = team.team;

              // Check for valid team ID
              if (typeof team.id !== 'number') {
                console.warn(`     ⚠️  Invalid team ID, skipping:`, team);
                return;
              }

              // Check if this team-season-competition link already exists
              if (existingTeamsSet.has(team.id)) {
                teamsSkipped++;
                return;
              }

              // Insert each team into PostgreSQL
              const query = `
                INSERT INTO "TeamSeason" ("teamId", "apiCompetitionId", "season", "createdAt")
                VALUES ($1, $2, $3, NOW())
                ON CONFLICT ("teamId", "apiCompetitionId", "season") DO NOTHING;
              `;
              const seasonString = `${seasonData.season}/${seasonData.season + 1}`;
              await pool.query(query, [team.id, competitionId, seasonString]);
              teamsSuccessful++;
            } 
            catch (error) {
              // Try to insert the team data into PostgreSQL team table
              console.log(`     Team data:`, team);
              const teamCC = team.country ?? team.countryCode;
              try {
                const countryCode = countryNameMapping[teamCC];
                const teamValues = [
                  team.id,
                  team.name || null,
                  team.logo || null,
                  team.national || false,
                  countryCode || null,
                  null,
                  null,
                  null
                ];
                const query = `
                  INSERT INTO "Team" (id, name, logo, national, "countryCode", lat, lng, "isFemale")
                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                  ON CONFLICT (id) DO NOTHING;
                `;
                await pool.query(query, teamValues);
                console.log(`     ℹ️  Inserted missing team ID: ${team.id}, retrying team-season insert...`);
                teamsCreated++;
              }
              catch (error) {
                teamsFailed++;
                teamsFailedCountries.push(teamCC);
              }
            }
          }));
        }
      } catch (error) {
      }
    }

    // Final summary
    console.log(`\n✅ ApiCompetition migration completed!`);
    console.log(`   📊 Successfully migrated: ${teamsSuccessful}`);
    console.log(`   ❌ Failed: ${teamsFailed}`);
    console.log(`   ⚠️  Failed countries: ${[...new Set(teamsFailedCountries)].join(', ')}`);
    console.log(`   🆕 Newly created teams: ${teamsCreated}`);
    console.log(`   ⏭️  Skipped: ${teamsSkipped}`);
    if (teamsFailed > 0) {
      console.log(`⚠️  ${teamsFailed} teams failed to migrate - check logs above`);
    }

  } catch (error) {
    console.error('❌ Fatal error in ApiCompetition migration:', error);
    throw error;
  }
}