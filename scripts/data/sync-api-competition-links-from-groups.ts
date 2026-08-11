import { loadNodeEnv } from '../../src/lib/env/loadNodeEnv';
loadNodeEnv();

type LinkCandidate = {
  competitionGroupId: number;
  apiCompetitionId: number;
};

type Summary = {
  dryRun: boolean;
  groupsScanned: number;
  groupsWithExistingLinks: number;
  groupsMatched: number;
  groupsUnmatched: number;
  linksCreated: number;
};

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
  };
}

function normalizeText(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
}

function scoreMatch(groupName: string, groupDisplayName: string, apiName: string): number {
  const normalizedGroupName = normalizeText(groupName);
  const normalizedDisplayName = normalizeText(groupDisplayName);
  const normalizedApiName = normalizeText(apiName);

  if (!normalizedGroupName && !normalizedDisplayName) return 0;

  if (normalizedGroupName === normalizedApiName || normalizedDisplayName === normalizedApiName) return 100;
  if (normalizedGroupName && normalizedApiName.includes(normalizedGroupName)) return 90;
  if (normalizedDisplayName && normalizedApiName.includes(normalizedDisplayName)) return 90;
  if (normalizedApiName.includes(normalizedGroupName) || normalizedApiName.includes(normalizedDisplayName)) return 80;

  return 0;
}

async function run() {
  const { dryRun } = parseArgs();
  const { prisma } = await import('../../src/lib/db/prisma');

  const groups = await prisma.competitionGroup.findMany({
    where: {
      isActive: true,
      type: 'DOMESTIC_LEAGUE',
      isFemale: true,
    },
    select: {
      id: true,
      name: true,
      displayName: true,
      countryCode: true,
      apiCompetitions: {
        select: {
          apiCompetitionId: true,
        },
      },
    },
    orderBy: [{ countryCode: 'asc' }, { name: 'asc' }],
  });

  const apiCompetitions = await prisma.apiCompetition.findMany({
    select: {
      id: true,
      name: true,
      countryCode: true,
      type: true,
    },
  });

  const existingLinkSet = new Set(
    groups.flatMap((group) => group.apiCompetitions.map((mapping) => `${group.id}::${mapping.apiCompetitionId}`))
  );

  const linksToCreate: LinkCandidate[] = [];
  let groupsScanned = 0;
  let groupsWithExistingLinks = 0;
  let groupsMatched = 0;
  let groupsUnmatched = 0;

  for (const group of groups) {
    groupsScanned += 1;

    if (group.apiCompetitions.length > 0) {
      groupsWithExistingLinks += 1;
      continue;
    }

    const candidates = apiCompetitions
      .filter((apiCompetition) => apiCompetition.countryCode === group.countryCode)
      .map((apiCompetition) => ({
        apiCompetition,
        score: scoreMatch(group.name, group.displayName, apiCompetition.name),
      }))
      .filter((candidate) => candidate.score > 0)
      .sort((left, right) => right.score - left.score || left.apiCompetition.name.localeCompare(right.apiCompetition.name));

    const best = candidates[0];
    const tiedBest = candidates.filter((candidate) => candidate.score === best?.score);

    if (!best || tiedBest.length !== 1) {
      groupsUnmatched += 1;
      continue;
    }

    groupsMatched += 1;
    linksToCreate.push({
      competitionGroupId: group.id,
      apiCompetitionId: best.apiCompetition.id,
    });
  }

  if (!dryRun && linksToCreate.length > 0) {
    await prisma.competitionGroupApiCompetition.createMany({
      data: linksToCreate,
      skipDuplicates: true,
    });
  }

  console.log('Competition-group link sync summary:');
  console.log(`- Mode: ${dryRun ? 'dry-run' : 'execute'}`);
  console.log(`- Female domestic groups scanned: ${groupsScanned}`);
  console.log(`- Groups with existing links skipped: ${groupsWithExistingLinks}`);
  console.log(`- Groups matched: ${groupsMatched}`);
  console.log(`- Groups unmatched: ${groupsUnmatched}`);
  console.log(`- Links created: ${dryRun ? linksToCreate.length : linksToCreate.length}`);

  await prisma.$disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});