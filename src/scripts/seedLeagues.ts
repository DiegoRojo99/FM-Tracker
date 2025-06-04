import 'dotenv/config';
import { fetchFromApi } from '../lib/apiFootball';
import { db } from '../lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { ApiLeague, ApiLeagueSeason } from '@/lib/types/FootballAPI';

// List of FM-supported countries (can expand)
const fmCountries = [
  'England', 'Italy', 'Germany', 'France', 'Spain', 
  'Portugal', 'Netherlands', 'Scotland', 'Brazil', 'Argentina', 
  'USA', 'Mexico', 'Belgium', 'Turkey', 'Greece', 'Switzerland', 
  'Denmark', 'Sweden', 'Norway',
  'Hungary', 'Slovenia', 'Czech-Republic',
];

const targetSeason = 2023; // FM24 season

async function seedLeagues() {
  const leagues: ApiLeague[] = await fetchFromApi('/leagues');

  const filtered = leagues.filter((l: ApiLeague) =>
    fmCountries.includes(l.country.name) &&
    l.seasons.some((s: ApiLeagueSeason) => s.year === targetSeason) &&
    l.league && l.league.name && l.league.logo
  );

  for (const league of filtered) {
    const data = {
      id: league.league.id,
      name: league.league.name,
      type: league.league.type, // league / cup / supercup
      logo: league.league.logo,
      countryCode: league.country.code || league.country.name.slice(0, 3).toUpperCase(),
      countryName: league.country.name,
      season: targetSeason
    };

    await setDoc(doc(collection(db, 'competitions'), data.id.toString()), data);
    console.log(`✅ Added: ${data.name} (${data.countryName})`);
  }

  console.log('🏁 Done seeding leagues.');
}

seedLeagues().catch(console.error);
