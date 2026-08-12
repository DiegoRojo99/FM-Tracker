import { loadNodeEnv } from '../../src/lib/env/loadNodeEnv';
loadNodeEnv();

type ScriptOptions = {
  dryRun: boolean;
};

type Summary = {
  mode: 'dry-run' | 'execute';
  teamsScanned: number;
  teamsUpdated: number;
  teamsUnchanged: number;
  derivedFemale: number;
  derivedMale: number;
  derivedNull: number;
  conflictingSignals: number;
};

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);
  return {
    dryRun: !args.includes('--execute'),
  };
}

async function run() {
  const options = parseArgs();
  const { prisma } = await import('../../src/lib/db/prisma');

  const teams = await prisma.team.findMany({
    select: {
      id: true,
      name: true,
      isFemale: true,
      teamSeasons: {
        select: {
          apiCompetition: {
            select: {
              isFemale: true,
              isActive: true,
            },
          },
        },
      },
    },
  });

  const summary: Summary = {
    mode: options.dryRun ? 'dry-run' : 'execute',
    teamsScanned: teams.length,
    teamsUpdated: 0,
    teamsUnchanged: 0,
    derivedFemale: 0,
    derivedMale: 0,
    derivedNull: 0,
    conflictingSignals: 0,
  };

  for (const team of teams) {
    const statuses = team.teamSeasons
      .map((entry) => entry.apiCompetition)
      .filter((competition): competition is NonNullable<typeof competition> => Boolean(competition))
      .filter((competition) => competition.isActive)
      .map((competition) => competition.isFemale)
      .filter((value): value is boolean => value === true || value === false);

    const hasFemale = statuses.some((status) => status === true);
    const hasMale = statuses.some((status) => status === false);

    let derived: boolean | null;
    if (hasFemale && hasMale) {
      // If data has both signals, prefer female to avoid false negatives in women flows.
      derived = true;
      summary.conflictingSignals += 1;
    } else if (hasFemale) {
      derived = true;
    } else if (hasMale) {
      derived = false;
    } else {
      derived = null;
    }

    if (derived === true) summary.derivedFemale += 1;
    else if (derived === false) summary.derivedMale += 1;
    else summary.derivedNull += 1;

    if (team.isFemale === derived) {
      summary.teamsUnchanged += 1;
      continue;
    }

    summary.teamsUpdated += 1;

    if (!options.dryRun) {
      await prisma.team.update({
        where: { id: team.id },
        data: { isFemale: derived },
      });
    }
  }

  console.log('Team gender sync from mapped competitions:');
  console.log(`- Mode: ${summary.mode}`);
  console.log(`- Teams scanned: ${summary.teamsScanned}`);
  console.log(`- Teams updated: ${summary.teamsUpdated}`);
  console.log(`- Teams unchanged: ${summary.teamsUnchanged}`);
  console.log(`- Derived female/male/null: ${summary.derivedFemale}/${summary.derivedMale}/${summary.derivedNull}`);
  console.log(`- Teams with conflicting competition signals: ${summary.conflictingSignals}`);

  await prisma.$disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
