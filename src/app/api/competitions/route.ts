import { adminDB } from '@/lib/auth/firebase-admin';
import { Competition, Country } from '@/lib/types/Country&Competition';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get('country');
  const compType = searchParams.get('type');

  let countriesToQuery: string[] = [];

  if (country) countriesToQuery = [country];
  else {
    // Fetch all country codes
    const countriesSnap = await adminDB.collection('countries')
      .where('inFootballManager', '==', true)
      .get();

    countriesToQuery = countriesSnap.docs.map(doc => doc.id);
  }

  const allCountriesSnap = await adminDB.collection('countries')
    .where('inFootballManager', '==', true)
    .get();    
  const allCountries = allCountriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as Country }));

  const competitions: Competition[] = [];
  // Country code check
  for (let code of countriesToQuery) {
    let ref = adminDB.collection(`countries/${code}/competitions`);
    let query = ref.where('inFootballManager', '==', true);
    let snapshot = await query.get();
    if (!snapshot.size) {
      const nameCheck = allCountries.find(c => c.name === code);
      if(!nameCheck?.code) continue;
      code = nameCheck.code;
      ref = adminDB.collection(`countries/${nameCheck.code}/competitions`);
      query = ref.where('inFootballManager', '==', true);
    }

    if (compType) {
      const normalizedType = compType.charAt(0).toUpperCase() + compType.slice(1).toLowerCase();
      query = query.where('type', '==', normalizedType);
    }
    
    snapshot = await query.get();
    snapshot.forEach(doc => {
      competitions.push({
        ...doc.data() as Competition,
        countryCode: code,
      });
    });
  }

  return new Response(JSON.stringify(competitions), { status: 200 });
}
