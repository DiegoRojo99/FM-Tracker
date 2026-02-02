import 'dotenv/config';
import { fetchFromApi } from '@/lib/apiFootball';
import { prisma } from '@/lib/db/prisma';
import { Country } from '../../../prisma/generated/client';

async function seedCountries() {
  const countries = await fetchFromApi('/countries');

  for (const country of countries) {
    const countryData: Omit<Country, 'id'> = {
      name: country.name,
      code: country.code || '',
      flag: country.flag || '',
      inFootballManager: country.inFootballManager || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await prisma.country.upsert({
      where: { code: countryData.code },
      create: countryData,
      update: countryData,
    });
    console.log(`✅ Added: ${country.name}`);
  }

  console.log('🌍 All countries seeded.');
}

seedCountries().catch(console.error);
