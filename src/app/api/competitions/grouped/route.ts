import { prisma } from '@/lib/db/prisma';
import { NextRequest } from 'next/server';
import { CompetitionGroup, Country } from '../../../../../prisma/generated/client';
import { CountryWithCompetitions } from '@/lib/types/prisma/Competitions';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get('country');
  const compType = searchParams.get('type');

  const groupCompetitions = await prisma.competitionGroup.findMany({
    where: {
      isActive: true,
      ...(country ? { countryCode: country } : {}),
      ...(compType ? { type: compType.charAt(0).toUpperCase() + compType.slice(1).toLowerCase() } : {})
    },
  });

  // Group competitions by country and handle grouping
  const countryCompMap: Record<string, CompetitionGroup[]> = groupCompetitions.reduce((acc, comp) => {
    if (!acc[comp.countryCode]) {
      acc[comp.countryCode] = [];
    }
    acc[comp.countryCode].push(comp);
    return acc;
  }, {} as Record<string, CompetitionGroup[]>);

  const countriesToImport = Object.keys(countryCompMap);
  const importedCountries: Country[] = await prisma.country.findMany({
    where: {
      code: { in: countriesToImport }
    },
  });
  
  const competitionsByCountry: CountryWithCompetitions[] = importedCountries.map((country) => ({
    ...country,
    competitions: countryCompMap[country.code] || []
  }));

  return new Response(JSON.stringify(competitionsByCountry), { status: 200 });
}