import { adminDB } from "@/lib/auth/firebase-admin";

const countriesInFM = [
  'Argentina', 'Australia', 'Austria', 'Belarus', 'Belgium', 'Brazil', 'Bulgaria',
  'Canada', 'Chile', 'China PR', 'Colombia', 'Croatia', 'Czech Republic', 'Denmark',
  'England', 'Finland', 'France', 'Germany', 'Greece', 'Hong Kong', 'Hungary',
  'Iceland', 'India', 'Indonesia', 'Israel', 'Italy', 'Japan', 'Korea Republic',
  'Latvia', 'Malaysia', 'Mexico', 'Netherlands', 'Northern Ireland', 'Norway',
  'Peru', 'Poland', 'Portugal', 'Republic Ireland', 'Romania', 'Russia', 'Scotland',
  'Serbia', 'Singapore', 'Slovakia', 'Slovenia', 'South Africa', 'Spain', 'Sweden',
  'Switzerland', 'Turkey', 'Ukraine', 'Uruguay', 'USA', 'Wales',
];

async function updateCountries() {
  const snapshot = await adminDB.collection('countries').get();
  const batch = adminDB.batch();

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const isInFM = countriesInFM.includes(data.name);
    batch.update(doc.ref, { inFootballManager: isInFM });
  });

  await batch.commit();
  console.log('✅ Countries updated with inFootballManager flag.');
}

updateCountries().catch(console.error);
