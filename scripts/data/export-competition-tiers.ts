import { loadNodeEnv } from '../../src/lib/env/loadNodeEnv';
loadNodeEnv();

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

async function run() {
  const { prisma } = await import('../../src/lib/db/prisma');

  const tiered = await prisma.competitionGroup.findMany({
    where: { tier: { not: null } },
    select: { name: true, countryCode: true, tier: true },
    orderBy: [{ countryCode: 'asc' }, { tier: 'asc' }, { name: 'asc' }],
  });

  const snapshot = tiered.map(c => ({ name: c.name, countryCode: c.countryCode, tier: c.tier as number }));

  const outPath = resolve(process.cwd(), 'scripts/data/competition-tiers-snapshot.json');
  writeFileSync(outPath, JSON.stringify(snapshot, null, 2));
  console.log(`Exported ${snapshot.length} tier assignments → scripts/data/competition-tiers-snapshot.json`);

  await prisma.$disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
