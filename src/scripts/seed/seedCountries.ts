import 'dotenv/config';
import { fetchFromApi } from '@/lib/apiFootball';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

async function seedCountries() {
  const countries = await fetchFromApi('/countries');

  for (const country of countries) {
    const docId = country.code || country.name.replace(/\s+/g, '-').toLowerCase();

    const countryData = {
      name: country.name,
      code: country.code || '',
      flag: country.flag || '',
    };

    await setDoc(doc(collection(db, 'countries'), docId), countryData);
    console.log(`✅ Added: ${country.name}`);
  }

  console.log('🌍 All countries seeded.');
}

seedCountries().catch(console.error);
