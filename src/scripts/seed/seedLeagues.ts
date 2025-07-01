import 'dotenv/config';
import { fetchFromApi } from '@/lib/apiFootball';
import { db } from '@/lib/db/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { ApiLeague, ApiLeagueSeason } from '@/lib/types/FootballAPI';
import { algoliaWriteClient } from '@/lib/algolia/algolia';

// List of FM-supported countries (can expand)
const seededCountries = [
  'England', 'Italy', 'Germany', 'France', 'Spain', // Top 5 leagues
  'Portugal', 'Netherlands', 'Scotland', 'Belgium', 'Turkey', // Next 5 european leagues
  'Brazil', 'Argentina', // South America
  'USA', 'Mexico', // North America
  'Greece', 'Switzerland', // Other European leagues
  'Denmark', 'Sweden', 'Norway', // Nordic countries
  'Hungary', 'Slovenia', 'Czech-Republic', // Coached teams  
  'Wales', 'Northern-Ireland', 'Ireland', // UK regions
  'Poland', 'Austria', 'Slovakia', // Central Europe
  'Finland', 'Iceland', // Nordic countries
  'South-Africa', // Africa
  'Japan', 'South-Korea', 'Hong-Kong', 'China', // Asia
  'Australia',  // Oceania
  'World',  
  'Belgium', 'Belarus', 'Chile', 'Bulgaria',
  'India', 'Indonesia', 'Israel', 'Peru', 'Singapore', 'Uruguay',
  'Canada', 'Croatia', 'Colombia', 'Latvia', 'Malaysia', 'Serbia',
  'Romania', 'Russia', 'Gibraltar',
];

const fmCountries: string[] = [
];

const targetSeason = 2023; // FM24 season
const competitionIndex = algoliaWriteClient.initIndex('competitions_index');

async function seedLeagues() {
  const leagues: ApiLeague[] = await fetchFromApi('/leagues');

  const filtered = leagues.filter((l: ApiLeague) =>
    fmCountries.includes(l.country.name) &&
    !seededCountries.includes(l.country.name) &&
    l.seasons.some((s: ApiLeagueSeason) => s.year === targetSeason) &&
    l.league && l.league.name && l.league.logo
  );

  const algoliaCompetitions = [];
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

    algoliaCompetitions.push({
      objectID: data.id.toString(),
      ...data
    });

    await setDoc(doc(collection(db, 'countries', data.countryCode, 'competitions'), data.id.toString()), data);
    console.log(`✅ Added: ${data.name} (${data.countryName})`);
  }

  // Add seeded countries to Algolia
  await competitionIndex.saveObjects(algoliaCompetitions);
  console.log('🏁 Done seeding leagues.');
}

seedLeagues().catch(console.error);
