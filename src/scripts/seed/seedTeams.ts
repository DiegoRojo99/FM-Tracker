import 'dotenv/config';
import { fetchFromApi } from '@/lib/apiFootball';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { ApiTeam } from '@/lib/types/FootballAPI';
import { leaguesToSeed, seededLeagues } from '../data/leagues';

async function seedTeams() {
  const unseededLeagues = leaguesToSeed.filter(
    league => !seededLeagues.some(l => l.id === league.id)
  );
  for (const league of unseededLeagues) {
    console.log(`📥 Fetching teams for league ${league.id} (${league.season})`);

    const teams: ApiTeam[] = await fetchFromApi(
      `/teams?league=${league.id}&season=${league.season}`
    );

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

      await setDoc(doc(collection(db, 'teams'), data.id.toString()), data);
      console.log(`✅ Added: ${data.name}`);
    }
  }

  console.log('🏁 All teams seeded.');
}

seedTeams().catch(console.error);
