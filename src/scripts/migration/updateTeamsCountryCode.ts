import { adminDB } from '@/lib/auth/firebase-admin';
import { Country } from '@/lib/types/Country&Competition';
import { Team } from '@/lib/types/Team';

async function updateTeamsCountryCode() {
  const countriesSnap = await adminDB.collection('countries').get();

  // Create a map of country names to codes
  const countryMap: Record<string, string> = {};
  countriesSnap.forEach((doc) => {
    const data = doc.data() as Country;
    if (data.name && data.code) {
      countryMap[data.name] = data.code;
    }
  });

  console.log(`Found ${Object.keys(countryMap).length} countries.`);

  const teamsSnap = await adminDB.collection('teams').get();
  console.log(`Found ${teamsSnap.size} teams.`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const doc of teamsSnap.docs) {
    console.log(`Processing team: ${doc.id}`);
    const team = doc.data() as Team;
    const teamRef = doc.ref;

    const countryName = team.countryCode;
    console.log(`Team ${team.name} has countryName: "${countryName}"`);
    const countryCode = countryMap[countryName];

    if (!countryCode) {
      console.warn(`⚠️ Skipping team ${team.name} — no code found for country "${countryName}"`);
      skippedCount++;
      continue;
    }

    await teamRef.update({ countryCode });
    updatedCount++;
  }

  console.log(`\n✅ Done. ${updatedCount} teams updated, ${skippedCount} skipped.`);
}

updateTeamsCountryCode().catch(console.error);
