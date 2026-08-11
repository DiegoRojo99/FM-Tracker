import { loadNodeEnv } from '../../src/lib/env/loadNodeEnv';
loadNodeEnv();

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type CompetitionSettingsSnapshotEntry = {
  name: string;
  countryCode: string;
  type: string;
  tier: number | null;
  isActive: boolean;
};

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
  };
}

async function run() {
  const { dryRun } = parseArgs();
  const snapshotPath = resolve(process.cwd(), 'scripts/data/competition-settings-snapshot.json');

  if (!existsSync(snapshotPath)) {
    throw new Error('Missing scripts/data/competition-settings-snapshot.json. Run export script first.');
  }

  const snapshotRaw = readFileSync(snapshotPath, 'utf-8');
  const snapshot: CompetitionSettingsSnapshotEntry[] = JSON.parse(snapshotRaw);

  const { prisma } = await import('../../src/lib/db/prisma');

  let updatedRows = 0;
  let unmatchedRows = 0;

  for (const entry of snapshot) {
    const existing = await prisma.competitionGroup.findFirst({
      where: {
        countryCode: entry.countryCode,
        name: { equals: entry.name, mode: 'insensitive' },
      },
      select: { id: true, isActive: true, tier: true, type: true },
    });

    if (!existing) {
      unmatchedRows += 1;
      console.warn(`Unmatched competition: ${entry.countryCode} | ${entry.name}`);
      continue;
    }

    const changed = existing.isActive !== entry.isActive || existing.tier !== entry.tier;
    if (!changed) continue;

    if (!dryRun) {
      await prisma.competitionGroup.update({
        where: { id: existing.id },
        data: {
          isActive: entry.isActive,
          tier: entry.tier,
        },
      });
    }

    updatedRows += 1;
  }

  console.log(dryRun ? 'Dry run complete.' : 'Apply complete.');
  console.log(`Snapshot rows: ${snapshot.length}`);
  console.log(`Updated rows: ${updatedRows}`);
  console.log(`Unmatched rows: ${unmatchedRows}`);

  await prisma.$disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
