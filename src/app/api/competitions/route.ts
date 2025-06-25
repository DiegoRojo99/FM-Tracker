import { adminDB } from '@/lib/auth/firebase-admin';
import { Competition } from '@/lib/types/Country&Competition';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get('country');
  const compType = searchParams.get('type');

  let countriesToQuery: string[] = [];

  if (country) {
    countriesToQuery = [country];
  } 
  else {
    // Fetch all country codes
    const countriesSnap = await adminDB.collection('countries')
      .where('inFootballManager', '==', true)
      .get();

    countriesToQuery = countriesSnap.docs.map(doc => doc.id);
  }

  const competitions: Competition[] = [];
  for (const code of countriesToQuery) {
    const ref = adminDB.collection(`countries/${code}/competitions`);
    let query = ref.where('inFootballManager', '==', true);

    if (compType) {
      const normalizedType = compType.charAt(0).toUpperCase() + compType.slice(1).toLowerCase();
      query = query.where('type', '==', normalizedType);
    }

    const snapshot = await query.get();
    snapshot.forEach(doc => {
      competitions.push({
        ...doc.data() as Competition,
        countryCode: code,
      });
    });
  }

  return new Response(JSON.stringify(competitions), { status: 200 });
}
