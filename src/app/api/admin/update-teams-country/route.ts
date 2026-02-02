import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

async function updateTeamsCountryCode() {
  const countries = await prisma.country.findMany({});

  // Create a map of country names to codes
  const countryMap: Record<string, string> = countries.reduce((map: Record<string, string>, country) => {
    map[country.name] = country.code;
    return map;
  }, {});

  console.log(`Found ${Object.keys(countryMap).length} countries.`);
  const teams = await prisma.team.findMany({});
  console.log(`Found ${teams.length} teams.`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const team of teams) {
    console.log(`Processing team: ${team.id}`);
    const countryName = team.countryCode;
    console.log(`Team ${team.name} has countryName: "${countryName}"`);
    const countryCode = countryMap[countryName];

    if (!countryCode) {
      console.warn(`⚠️ Skipping team ${team.name} — no code found for country "${countryName}"`);
      skippedCount++;
      continue;
    }

    await prisma.team.update({
      where: { id: team.id },
      data: { countryCode }
    });
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
