import { loadNodeEnv } from '../../src/lib/env/loadNodeEnv';
loadNodeEnv();

type ScriptOptions = {
  dryRun: boolean;
  includeInactive: boolean;
};

type Summary = {
  dryRun: boolean;
  includeInactive: boolean;
  apiCompetitionsScanned: number;
  groupsCreated: number;
  groupsReused: number;
  linksCreated: number;
  linksExisting: number;
};

type LinkRow = {
  competitionGroupId: number;
  apiCompetitionId: number;
};

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);
  const argText = args.join(' ');

  const executeFromArgs = /(^|\s)--execute(\s|$)/.test(argText);
  const executeFromEnv = process.env.SEED_EXECUTE === '1' || process.env.npm_config_execute === 'true' || process.env.npm_config_execute === '1';

  return {
    dryRun: !(executeFromArgs || executeFromEnv),
    includeInactive: /(^|\s)--include-inactive(\s|$)/.test(argText),
  };
}

function normalizeType(type: string | null | undefined): string {
  const value = (type ?? '').trim();
  if (!value) return 'Other';

  if (value === 'DOMESTIC_LEAGUE') return value;
  if (value === 'DOMESTIC_CUP') return value;
  if (value === 'CONTINENTAL_CLUB') return value;
  if (value === 'INTERNATIONAL_NT') return value;
  if (value === 'SUPER_CUP') return value;
  if (value === 'Other') return value;

  const lowered = value.toLowerCase();
  if (lowered === 'league' || lowered === 'domestic league' || lowered === 'domestic_league') return 'DOMESTIC_LEAGUE';
  if (lowered === 'cup' || lowered === 'domestic cup' || lowered === 'domestic_cup') return 'DOMESTIC_CUP';
  if (lowered === 'super cup' || lowered === 'super_cup' || lowered === 'supercup') return 'SUPER_CUP';
  if (lowered === 'continental club' || lowered === 'continental_club') return 'CONTINENTAL_CLUB';
  if (lowered === 'international nt' || lowered === 'international_nt') return 'INTERNATIONAL_NT';

  return 'Other';
}

function groupKey(name: string, countryCode: string): string {
  return `${countryCode}::${name}`;
}

async function run() {
  const options = parseArgs();
  const { prisma } = await import('../../src/lib/db/prisma');

  if (!options.dryRun) {
    await prisma.$executeRawUnsafe(`
      SELECT setval(
        pg_get_serial_sequence('"CompetitionGroup"', 'id'),
        COALESCE((SELECT MAX(id) FROM "CompetitionGroup"), 0),
        true
      )
    `);

    await prisma.$executeRawUnsafe(`
      SELECT setval(
        pg_get_serial_sequence('"CompetitionGroupApiCompetition"', 'id'),
        COALESCE((SELECT MAX(id) FROM "CompetitionGroupApiCompetition"), 0),
        true
      )
    `);
  }

  const apiCompetitions = await prisma.apiCompetition.findMany({
    where: options.includeInactive ? undefined : { isActive: true },
    select: {
      id: true,
      name: true,
      countryCode: true,
      type: true,
      tier: true,
      isFemale: true,
      isActive: true,
      logoUrl: true,
    },
    orderBy: [{ countryCode: 'asc' }, { name: 'asc' }],
  });

  const existingGroups = await prisma.competitionGroup.findMany({
    select: {
      id: true,
      name: true,
      countryCode: true,
    },
  });

  const groupByKey = new Map<string, { id: number; name: string; countryCode: string }>();
  for (const group of existingGroups) {
    groupByKey.set(groupKey(group.name, group.countryCode), group);
  }

  const existingLinks = await prisma.competitionGroupApiCompetition.findMany({
    select: {
      competitionGroupId: true,
      apiCompetitionId: true,
    },
  });

  const linkSet = new Set(existingLinks.map((row) => `${row.competitionGroupId}::${row.apiCompetitionId}`));

  const groupsToCreate: Array<{
    name: string;
    displayName: string;
    countryCode: string;
    type: string;
    tier: number | null;
    isFemale: boolean | null;
    logoUrl: string | null;
    isActive: boolean;
  }> = [];

  const linksToCreate: LinkRow[] = [];

  const summary: Summary = {
    dryRun: options.dryRun,
    includeInactive: options.includeInactive,
    apiCompetitionsScanned: apiCompetitions.length,
    groupsCreated: 0,
    groupsReused: 0,
    linksCreated: 0,
    linksExisting: 0,
  };

  for (const competition of apiCompetitions) {
    const key = groupKey(competition.name, competition.countryCode);
    let mappedGroup = groupByKey.get(key);

    if (!mappedGroup) {
      summary.groupsCreated += 1;

      if (!options.dryRun) {
        const created = await prisma.competitionGroup.create({
          data: {
            name: competition.name,
            displayName: competition.name,
            countryCode: competition.countryCode,
            type: normalizeType(competition.type),
            tier: competition.tier,
            isFemale: competition.isFemale,
            logoUrl: competition.logoUrl,
            isActive: competition.isActive,
          },
          select: { id: true, name: true, countryCode: true },
        });

        mappedGroup = created;
      } else {
        mappedGroup = {
          id: -1 * (summary.groupsCreated + summary.groupsReused + 1),
          name: competition.name,
          countryCode: competition.countryCode,
        };
      }

      groupByKey.set(key, mappedGroup);
      if (options.dryRun) {
        groupsToCreate.push({
          name: competition.name,
          displayName: competition.name,
          countryCode: competition.countryCode,
          type: normalizeType(competition.type),
          tier: competition.tier,
          isFemale: competition.isFemale,
          logoUrl: competition.logoUrl,
          isActive: competition.isActive,
        });
      }
    } else {
      summary.groupsReused += 1;
    }

    const linkKey = `${mappedGroup.id}::${competition.id}`;
    if (linkSet.has(linkKey)) {
      summary.linksExisting += 1;
      continue;
    }

    summary.linksCreated += 1;
    if (!options.dryRun) {
      linksToCreate.push({
        competitionGroupId: mappedGroup.id,
        apiCompetitionId: competition.id,
      });
      linkSet.add(linkKey);
    }
  }

  if (!options.dryRun && linksToCreate.length > 0) {
    await prisma.competitionGroupApiCompetition.createMany({
      data: linksToCreate,
      skipDuplicates: true,
    });
  }

  console.log('CompetitionGroup creation/link sync from ApiCompetition:');
  console.log(`- Mode: ${options.dryRun ? 'dry-run' : 'execute'}`);
  console.log(`- Include inactive API competitions: ${options.includeInactive ? 'yes' : 'no'}`);
  console.log(`- API competitions scanned: ${summary.apiCompetitionsScanned}`);
  console.log(`- CompetitionGroups created: ${summary.groupsCreated}`);
  console.log(`- CompetitionGroups reused: ${summary.groupsReused}`);
  console.log(`- Links created: ${summary.linksCreated}`);
  console.log(`- Links already existing: ${summary.linksExisting}`);

  if (options.dryRun && groupsToCreate.length > 0) {
    console.log('\nSample groups to create (first 20):');
    for (const row of groupsToCreate.slice(0, 20)) {
      console.log(`  - ${row.countryCode} | ${row.name} | ${row.type} | tier=${row.tier ?? 'null'} | female=${row.isFemale === null ? 'null' : row.isFemale}`);
    }
  }

  await prisma.$disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
