import { NextRequest, NextResponse } from 'next/server';
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

  return { updatedCount, skippedCount };
}

export async function GET() {
  try {
    const result = await updateTeamsCountryCode();
    return NextResponse.json({
      success: true,
      message: `✅ Done. ${result.updatedCount} teams updated, ${result.skippedCount} skipped.`,
      ...result
    });
  } catch (error) {
    console.error('Error updating teams:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
