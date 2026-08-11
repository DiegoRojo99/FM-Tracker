import { loadNodeEnv } from '../../src/lib/env/loadNodeEnv';
loadNodeEnv();

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

type CompetitionSettingsSnapshotEntry = {
  name: string;
  countryCode: string;
  type: string;
  tier: number | null;
  isActive: boolean;
};

async function run() {
  const { prisma } = await import('../../src/lib/db/prisma');

  const competitions = await prisma.competitionGroup.findMany({
    select: {
      name: true,
      countryCode: true,
      type: true,
      tier: true,
      isActive: true,
    },
    orderBy: [
      { countryCode: 'asc' },
      { type: 'asc' },
      { tier: 'asc' },
      { name: 'asc' },
    ],
  });

  const snapshot: CompetitionSettingsSnapshotEntry[] = competitions.map((competition) => ({
    name: competition.name,
    countryCode: competition.countryCode,
    type: competition.type,
    tier: competition.tier,
    isActive: competition.isActive,
  }));

  const outPath = resolve(process.cwd(), 'scripts/data/competition-settings-snapshot.json');
  writeFileSync(outPath, JSON.stringify(snapshot, null, 2));

  const activeCount = snapshot.filter((entry) => entry.isActive).length;
  const tieredCount = snapshot.filter((entry) => entry.tier !== null).length;
  console.log(`Exported ${snapshot.length} competitions to scripts/data/competition-settings-snapshot.json`);
  console.log(`Active competitions: ${activeCount}`);
  console.log(`Tiered competitions: ${tieredCount}`);

  await prisma.$disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
