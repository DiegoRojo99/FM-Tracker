import { Pool } from 'pg';
import admin from 'firebase-admin';

interface CupResult {
  name?: string;
  reachedRound: string;
  competitionId: number;
}

interface LeagueResult {
  position: number;
  competitionName?: string;
  competitionId: number;
}

export async function migrateSeasonCompetitionData(firestore: any, pool: Pool): Promise<void> {
  console.log('\n🏆 Starting Season Competition Data migration...');
  
  try {
    // Get all seasons that don't have competition data yet
    const seasonsWithoutCompetitionData = await pool.query(`
      SELECT s.id, s."saveId", s.season, s."teamId"
      FROM "Season" s
      WHERE NOT EXISTS (
        SELECT 1 FROM "CupResult" cr WHERE cr."seasonId" = s.id
      ) AND NOT EXISTS (
        SELECT 1 FROM "LeagueResult" lr WHERE lr."seasonId" = s.id
      )
      ORDER BY s.id
    `);

    console.log(`Found ${seasonsWithoutCompetitionData.rows.length} seasons without competition data`);

    if (seasonsWithoutCompetitionData.rows.length === 0) {
      console.log('✅ All seasons already have competition data migrated');
      return;
    }

    // Build a mapping from saveId to userId for Firestore queries
    const saveIdToUser = new Map<string, string>();
    const saveIds = [...new Set(seasonsWithoutCompetitionData.rows.map(row => row.saveId))];

    console.log(`📥 Building save ID to user mapping for ${saveIds.length} saves...`);
    
    // Get save to user mapping from PostgreSQL
    const saveUserMapping = await pool.query(`
      SELECT id, "userId" FROM "Save" WHERE id = ANY($1)
    `, [saveIds]);

    for (const save of saveUserMapping.rows) {
      saveIdToUser.set(save.id, save.userId);
    }

    // Build competition mapping from API ID to CompetitionGroup ID
    console.log('📥 Building competition mapping...');
    const competitionMapping = await pool.query(`
      SELECT cgac."apiCompetitionId", cg.id as "competitionGroupId"
      FROM "CompetitionGroupApiCompetition" cgac
      JOIN "CompetitionGroup" cg ON cgac."competitionGroupId" = cg.id
    `);

    const apiToGroupMap = new Map<number, number>();
    for (const mapping of competitionMapping.rows) {
      apiToGroupMap.set(mapping.apiCompetitionId, mapping.competitionGroupId);
    }

    let processedSeasons = 0;
    let cupResultsCreated = 0;
    let leagueResultsCreated = 0;
    let errorCount = 0;

    for (const seasonRow of seasonsWithoutCompetitionData.rows) {
      try {
        const userId = saveIdToUser.get(seasonRow.saveId);
        if (!userId) {
          console.log(`⚠️  No user found for save ${seasonRow.saveId}, skipping season ${seasonRow.id}`);
          continue;
        }

        // Fetch season data from Firestore
        const seasonDoc = await firestore
          .collection('users')
          .doc(userId)
          .collection('saves')
          .doc(seasonRow.saveId)
          .collection('seasons')
          .where('season', '==', seasonRow.season)
          .limit(1)
          .get();

        if (seasonDoc.empty) {
          console.log(`⚠️  Season ${seasonRow.season} not found in Firestore for save ${seasonRow.saveId}`);
          continue;
        }

        const seasonData = seasonDoc.docs[0].data();
        processedSeasons++;

        // Migrate cup results
        if (seasonData.cupResults && Array.isArray(seasonData.cupResults) && seasonData.cupResults.length > 0) {
          for (const cupResult of seasonData.cupResults) {
            if (cupResult.competitionId && cupResult.reachedRound) {
              const competitionGroupId = apiToGroupMap.get(parseInt(cupResult.competitionId));
              
              if (competitionGroupId) {
                await pool.query(`
                  INSERT INTO "CupResult" ("seasonId", "competitionId", "reachedRound", "createdAt")
                  VALUES ($1, $2, $3, NOW())
                `, [
                  seasonRow.id,
                  competitionGroupId,
                  cupResult.reachedRound
                ]);
                cupResultsCreated++;
              } else {
                console.log(`⚠️  Cup result references unknown competition ${cupResult.competitionId}`);
              }
            }
          }
        }

        // Migrate league result
        if (seasonData.leagueResult && seasonData.leagueResult.competitionId && seasonData.leagueResult.position) {
          const competitionGroupId = apiToGroupMap.get(parseInt(seasonData.leagueResult.competitionId));
          
          if (competitionGroupId) {
            // Determine promotion/relegation status based on position (simplified logic)
            const position = seasonData.leagueResult.position;
            const promoted = position <= 2; // Top 2 positions typically get promoted
            const relegated = position >= 18; // Bottom positions typically get relegated
            
            await pool.query(`
              INSERT INTO "LeagueResult" ("seasonId", "competitionId", "position", "promoted", "relegated", "createdAt")
              VALUES ($1, $2, $3, $4, $5, NOW())
            `, [
              seasonRow.id,
              competitionGroupId,
              position,
              promoted,
              relegated
            ]);
            leagueResultsCreated++;
          } else {
            console.log(`⚠️  League result references unknown competition ${seasonData.leagueResult.competitionId}`);
          }
        }

        if (processedSeasons % 10 === 0) {
          console.log(`📝 Processed ${processedSeasons} seasons...`);
        }

      } catch (error) {
        console.error(`❌ Error processing season ${seasonRow.id}:`, error);
        errorCount++;
      }
    }

    // Final summary
    console.log(`\n✅ Season Competition Data migration completed!`);
    console.log(`   📊 Seasons processed: ${processedSeasons}`);
    console.log(`   🏆 Cup results created: ${cupResultsCreated}`);
    console.log(`   🏅 League results created: ${leagueResultsCreated}`);
    
    if (errorCount > 0) {
      console.log(`   ❌ Errors: ${errorCount}`);
    }

  } catch (error) {
    console.error('❌ Fatal error in Season Competition Data migration:', error);
    throw error;
  }
}