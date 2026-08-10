import { loadNodeEnv } from '../../src/lib/env/loadNodeEnv';
loadNodeEnv();

/**
 * Exact (case-insensitive) names of tier-1 competitions per country code.
 * Use exact DB names only — substring matching caused lower-tier false positives.
 */
const TIER1_EXACT: Record<string, string[]> = {
  'GB-ENG': ['Premier League'],
  'GB-SCT': ['Scottish Premiership', 'Premiership'],
  'GB-WLS': ['Cymru Premier'],
  'GB-NIR': ['NIFL Premiership', 'Premiership'],
  'ES':     ['La Liga', 'LaLiga'],
  'DE':     ['Bundesliga'],
  'IT':     ['Serie A'],
  'FR':     ['Ligue 1'],
  'NL':     ['Eredivisie'],
  'PT':     ['Primeira Liga', 'Liga Portugal Betclic', 'Liga Portugal'],
  'BE':     ['Jupiler Pro League', 'First Division A'],
  'TR':     ['Süper Lig', 'Super Lig'],
  'RU':     ['Premier League'],
  'UA':     ['Premier League'],
  'CH':     ['Super League'],
  'AT':     ['Bundesliga'],
  'GR':     ['Super League', 'Super League 1'],
  'SE':     ['Allsvenskan'],
  'NO':     ['Eliteserien'],
  'DK':     ['Superliga'],
  'PL':     ['Ekstraklasa'],
  'CZ':     ['Czech Liga', 'Fortuna Liga'],
  'SK':     ['Niké Liga', 'Nike Liga', 'Fortuna Liga'],
  'HU':     ['OTP Bank Liga', 'Nemzeti Bajnokság', 'Nemzeti Bajnoksag'],
  'RO':     ['Liga 1', 'SuperLiga'],
  'HR':     ['HNL', 'Supersport HNL'],
  'RS':     ['Super Liga'],
  'SI':     ['PrvaLiga', 'Prva Liga'],
  'BG':     ['First Professional Football League', 'Efbet Liga', 'First League'],
  'FI':     ['Veikkausliiga'],
  'US':     ['MLS', 'Major League Soccer'],
  'MX':     ['Liga MX'],
  'BR':     ['Brasileirao', 'Série A', 'Serie A'],
  'AR':     ['Liga Profesional Argentina', 'Liga Profesional'],
  'UY':     ['Primera División', 'Primera Division'],
  'CL':     ['Primera División', 'Primera Division'],
  'CO':     ['Liga BetPlay DIMAYOR', 'Primera A'],
  'AU':     ['A-League'],
  'JP':     ['J1 League'],
  'KR':     ['K League 1'],
  'SA':     ['Roshn Saudi League', 'Saudi Professional League'],
  'EG':     ['Egyptian Premier League', 'Premier League'],
  'ZA':     ['DStv Premiership'],
  'NG':     ['Nigeria Premier Football League', 'Premier League'],
  'MA':     ['Botola Pro'],
  'BY':     ['Premier League'],
  'CA':     ['Canadian Premier League'],
  'CN':     ['Chinese Super League', 'Super League'],
  'AE':     ['UAE Pro League', 'Pro League'],
};

/** Competitions that were incorrectly set to tier 1 and need resetting. */
const WRONGLY_SET_TIER1: string[] = [
  '2. Bundesliga',
  'Challenger Pro League',
  'Primera División RFEF - Group 1',
  'Primera División RFEF - Group 2',
  'Primera RFEF',
  'Segunda RFEF',
  'Copa de la Liga Profesional',
  'Damallsvenskan',  // Swedish women's league
  'Liga 1 Feminin',  // Romanian women's league
];

async function run() {
  const { prisma } = await import('../../src/lib/db/prisma');

  // Step 1: Reset competitions that were incorrectly marked as tier 1.
  const resetResult = await prisma.competitionGroup.updateMany({
    where: { name: { in: WRONGLY_SET_TIER1 }, tier: 1 },
    data: { tier: null },
  });
  if (resetResult.count > 0) console.log(`Reset ${resetResult.count} incorrectly-set tier-1 competition(s).`);

  // Step 2: Set tier 1 via exact name matching per country.
  let updated = 0;
  for (const [countryCode, names] of Object.entries(TIER1_EXACT)) {
    for (const name of names) {
      const result = await prisma.competitionGroup.updateMany({
        where: { countryCode, name: { equals: name, mode: 'insensitive' } },
        data: { tier: 1 },
      });
      if (result.count > 0) {
        console.log(`  [${countryCode}] Tier 1 → ${name} (${result.count} row)`);
        updated += result.count;
      }
    }
  }

  if (updated === 0 && resetResult.count === 0) console.log('Nothing to update — all tiers already correct.');
  else console.log(`\nDone. Set tier=1 on ${updated} competition(s).`);

  await prisma.$disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
