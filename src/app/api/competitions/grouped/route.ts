import { adminDB } from '@/lib/auth/firebase-admin';
import { Competition, Country, CountryWithCompetitions } from '@/lib/types/Country&Competition';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get('country');
  const compType = searchParams.get('type');

  let countriesToQuery: Country[] = [];

  if (country) {
    const countrySnap = await adminDB.collection('countries').doc(country).get();
    if (countrySnap.exists) {
      countriesToQuery = [countrySnap.data() as Country];
    }
  }
  else {
    // Fetch all country codes
    const countriesSnap = await adminDB.collection('countries')
      .where('inFootballManager', '==', true)
      .get();

    countriesToQuery = countriesSnap.docs.map(doc => doc.data() as Country);
  }

  const countries: CountryWithCompetitions[] = [];
  for (const country of countriesToQuery) {
    let competitions: Competition[] = [];
    const ref = adminDB.collection(`countries/${country.code}/competitions`);
    let query = ref.where('inFootballManager', '==', true);

    if (compType) {
      const normalizedType = compType.charAt(0).toUpperCase() + compType.slice(1).toLowerCase();
      query = query.where('type', '==', normalizedType);
    }

    const snapshot = await query.get();
    competitions = snapshot.docs.map(doc => ({
      ...doc.data() as Competition,
    }));

    countries.push({
      ...country,
      competitions,
    });
  }

  return new Response(JSON.stringify(countries), { status: 200 });
}