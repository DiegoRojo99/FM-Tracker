import { prisma } from '../lib/db/prisma';
import { FM_COUNTRY_CODES } from '../lib/data/countryReference';

async function updateCountries() {
  const countries = await prisma.country.findMany();
  
  for (const country of countries) {
    const code = country.code as string;
    const isInFM = FM_COUNTRY_CODES.has(code);
    await prisma.country.update({
      where: { code },
      data: { inFootballManager: isInFM }
    });
  }

  console.log('✅ Countries updated with inFootballManager flag.');
}

updateCountries().catch(console.error);
