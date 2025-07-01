import { NextRequest, NextResponse } from 'next/server';
import { algoliaWriteClient } from '@/lib/algolia/algolia';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '@/lib/db/firebase';
import { ApiTeam } from '@/lib/types/FootballAPI';
import { fetchFromApi } from '@/lib/apiFootball';
import { Country } from '@/lib/types/Country&Competition';

const teamsIndex = algoliaWriteClient.initIndex('teams_index');
export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const teams: ApiTeam[] = await fetchFromApi(
        `/teams?league=${id}&season=2023`
    );

    if (!teams || teams.length === 0) {
      return new NextResponse(JSON.stringify({ message: 'No teams found' }), {
        status: 404,
      });
    }

    const countriesCollection = collection(db, 'countries');
    const countriesDocs = await getDocs(countriesCollection);
    const countries = countriesDocs.docs.map((doc) => ({
      id: doc.id,
      ...doc.data() as Country,
    }));

    const algoliaTeams = [];
    for (const team of teams) {
      const countryDoc = countries.find(
        (doc) => doc.name === team.team.country
      );
      const data = {
        id: team.team.id,
        name: team.team.name,
        logo: team.team.logo,
        countryName: team.team.country || '',
        countryCode: countryDoc ? countryDoc.code : '',
        leagueId: id,
        season: 2023,
        national: team.team.national || false,
        coordinates: {
          lat: team.venue?.lat ?? null,
          lng: team.venue?.lng ?? null,
        },
      };
      algoliaTeams.push({objectID: data.id, ...data});

      await setDoc(doc(collection(db, 'teams'), data.id.toString()), data);
      console.log(`✅ Added: ${data.name}`);
    }

    await teamsIndex.saveObjects(algoliaTeams);
    return new NextResponse(JSON.stringify({ message: 'Teams added successfully' }), {
      status: 201,
    });
  } 
  catch (error) {
    console.error('Error adding teams:', error);
    return new NextResponse(JSON.stringify({ message: 'Error adding teams' }), {
      status: 500,
    });
  }
}