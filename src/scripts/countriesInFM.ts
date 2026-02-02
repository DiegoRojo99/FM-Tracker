import { prisma } from '../lib/db/prisma';

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
  const countries = await prisma.country.findMany();
  
  for (const country of countries) {
    const isInFM = countriesInFM.includes(country.name);
    await prisma.country.update({
      where: { code: country.code },
      data: { inFootballManager: isInFM }
    });
  }

  console.log('✅ Countries updated with inFootballManager flag.');
}

updateCountries().catch(console.error);
