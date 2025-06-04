import 'dotenv/config';
import { fetchFromApi } from '../lib/apiFootball';
import { db } from '../lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { ApiTeam } from '@/lib/types/FootballAPI';

const leaguesToSeed = [
  { id: 39, season: 2023 }, // Premier League
  { id: 135, season: 2023 }, // Serie A
  { id: 78, season: 2023 }, // Bundesliga
  { id: 271, season: 2023 }, // Hungarian NB I
  { id: 61, season: 2023 }, // La Liga
  { id: 140, season: 2023 }, // Ligue 1
  { id: 88, season: 2023 }, // Eredivisie
];

async function seedTeams() {
  for (const league of leaguesToSeed) {
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
