import { adminDB } from '@/lib/auth/firebase-admin';
import { Country } from '@/lib/types/Country&Competition';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const countriesSnap = await adminDB
      .collection('countries')
      .where('inFootballManager', '==', true)
      .get();

    const countries = countriesSnap.docs.map((doc) => ({
      code: doc.id,
      ...doc.data(),
    })) as Country[];

    const countriesWithComps = await Promise.all(
      countries.map(async (country) => {
        const compsSnap = await adminDB
          .collection(`countries/${country.code}/competitions`)
          .where('inFootballManager', '==', true)
          .get();

        const competitions = compsSnap.docs.map((doc) => ({
          id: Number(doc.id),
          ...doc.data(),
        }));

        return {
          ...country,
          competitions,
        };
      })
    );

    return NextResponse.json(countriesWithComps);
  } catch (error) {
    console.error('Error fetching FM competitions:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
