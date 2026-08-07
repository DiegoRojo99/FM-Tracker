import { fetchFromApi } from '@/lib/apiFootball';
import { ApiTeam } from '@/lib/types/FootballAPI';
import { leaguesToSeed, seededLeagues } from '../data/leagues';
import { algoliaWriteClient } from '@/lib/algolia/algolia';
import { prisma } from '@/lib/db/prisma';
import { loadNodeEnv } from '@/lib/env/loadNodeEnv';
loadNodeEnv();

const teamsIndex = algoliaWriteClient.initIndex('teams_index');
async function seedTeams() {
  const unseededLeagues = leaguesToSeed.filter(
    league => !seededLeagues.some(l => l.id === league.id)
  );

  for (const league of unseededLeagues) {
    console.log(`📥 Fetching teams for league ${league.id} (${league.season})`);

    const teams: ApiTeam[] = await fetchFromApi(
      `/teams?league=${league.id}&season=${league.season}`
    );

    const algoliaTeams = [];
    for (const team of teams) {
      const data = {
        id: team.team.id,
        name: team.team.name,
        logo: team.team.logo,
        countryCode: team.team.country || '',
        leagueId: league.id,
        season: league.season,
        national: team.team.national || false,
        coordinates: {
          lat: team.venue?.lat ?? null,
          lng: team.venue?.lng ?? null,
        },
      };
      algoliaTeams.push({objectID: data.id, ...data});

      await prisma.team.upsert({
        where: { id: data.id },
        create: data,
        update: data,
      });
      console.log(`✅ Added: ${data.name}`);
    }

    await teamsIndex.saveObjects(algoliaTeams);
  }

  console.log('🏁 All teams seeded.');
}

seedTeams().catch(console.error);
