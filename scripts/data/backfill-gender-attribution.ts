import { loadNodeEnv } from '../../src/lib/env/loadNodeEnv';
loadNodeEnv();

type ScriptOptions = {
  dryRun: boolean;
};

type ApiCompetitionAttributionReason =
  | 'existing_true'
  | 'name_match'
  | 'participation_female'
  | 'participation_male'
  | 'default_false';

type Summary = {
  dryRun: boolean;
  apiCompetitionsTotal: number;
  apiCompetitionsUpdated: number;
  apiCompetitionReasonCounts: Record<ApiCompetitionAttributionReason, number>;
  competitionGroupsTotal: number;
  competitionGroupsUpdated: number;
  competitionGroupsTrue: number;
  competitionGroupsFalse: number;
  competitionGroupsNull: number;
  teamsTotal: number;
  teamsBefore: {
    female: number;
    male: number;
    unknown: number;
  };
  teamsAfter: {
    female: number;
    male: number;
    unknown: number;
  };
  teamsSetFemaleFromParticipation: number;
  teamsSetMaleFromParticipation: number;
  teamsDefaultedMale: number;
};

function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);
  const argText = args.join(' ');
  const executeFromArgs = /(^|\s)--execute(\s|$)/.test(argText);
  const executeFromEnv = process.env.SEED_EXECUTE === '1' || process.env.npm_config_execute === 'true' || process.env.npm_config_execute === '1';
  return { dryRun: !(executeFromArgs || executeFromEnv) };
}

function isWomenCompetitionName(name: string | null | undefined): boolean {
  if (!name) return false;
  return /women|womens|wsl|femenino|femenina|femenil|feminine|féminin|femminile|ladies|frauen|damen|damallsvenskan|f\.?league\s*women/i.test(name);
}

function mapCountRows(rows: Array<{ isFemale: boolean | null; _count: { _all: number } }>) {
  return {
    female: rows.find((row) => row.isFemale === true)?._count._all ?? 0,
    male: rows.find((row) => row.isFemale === false)?._count._all ?? 0,
    unknown: rows.find((row) => row.isFemale === null)?._count._all ?? 0,
  };
}

async function run() {
  const options = parseArgs();
  const { prisma } = await import('../../src/lib/db/prisma');

  const summary: Summary = {
    dryRun: options.dryRun,
    apiCompetitionsTotal: 0,
    apiCompetitionsUpdated: 0,
    apiCompetitionReasonCounts: {
      existing_true: 0,
      name_match: 0,
      participation_female: 0,
      participation_male: 0,
      default_false: 0,
    },
    competitionGroupsTotal: 0,
    competitionGroupsUpdated: 0,
    competitionGroupsTrue: 0,
    competitionGroupsFalse: 0,
    competitionGroupsNull: 0,
    teamsTotal: 0,
    teamsBefore: { female: 0, male: 0, unknown: 0 },
    teamsAfter: { female: 0, male: 0, unknown: 0 },
    teamsSetFemaleFromParticipation: 0,
    teamsSetMaleFromParticipation: 0,
    teamsDefaultedMale: 0,
  };

  const teamStatsBefore = await prisma.team.groupBy({
    by: ['isFemale'],
    _count: { _all: true },
  });

  summary.teamsBefore = mapCountRows(teamStatsBefore);
  summary.teamsTotal = summary.teamsBefore.female + summary.teamsBefore.male + summary.teamsBefore.unknown;

  const apiCompetitions = await prisma.apiCompetition.findMany({
    select: {
      id: true,
      name: true,
      isFemale: true,
      teamSeasons: {
        select: {
          team: {
            select: {
              isFemale: true,
            },
          },
        },
      },
    },
  });

  summary.apiCompetitionsTotal = apiCompetitions.length;

  for (const competition of apiCompetitions) {
    const hasFemaleParticipation = competition.teamSeasons.some((teamSeason) => teamSeason.team.isFemale === true);
    const hasMaleParticipation = competition.teamSeasons.some((teamSeason) => teamSeason.team.isFemale === false);

    let derived: boolean;
    let reason: ApiCompetitionAttributionReason;

    if (competition.isFemale === true) {
      derived = true;
      reason = 'existing_true';
    } else if (isWomenCompetitionName(competition.name)) {
      derived = true;
      reason = 'name_match';
    } else if (hasFemaleParticipation) {
      derived = true;
      reason = 'participation_female';
    } else if (hasMaleParticipation) {
      derived = false;
      reason = 'participation_male';
    } else {
      derived = false;
      reason = 'default_false';
    }

    summary.apiCompetitionReasonCounts[reason] += 1;

    if (competition.isFemale !== derived) {
      summary.apiCompetitionsUpdated += 1;
      if (!options.dryRun) {
        await prisma.apiCompetition.update({
          where: { id: competition.id },
          data: { isFemale: derived },
        });
      }
    }
  }

  const groups = await prisma.competitionGroup.findMany({
    select: {
      id: true,
      isFemale: true,
      apiCompetitions: {
        select: {
          apiCompetition: {
            select: { isFemale: true },
          },
        },
      },
    },
  });

  summary.competitionGroupsTotal = groups.length;

  for (const group of groups) {
    const mappedStatuses = group.apiCompetitions.map((entry) => entry.apiCompetition?.isFemale).filter((value) => value !== undefined);

    let rolledUp: boolean | null;

    if (mappedStatuses.length === 0 || mappedStatuses.some((value) => value === null)) {
      rolledUp = null;
    } else if (mappedStatuses.every((value) => value === true)) {
      rolledUp = true;
    } else if (mappedStatuses.every((value) => value === false)) {
      rolledUp = false;
    } else {
      rolledUp = null;
    }

    if (rolledUp === true) summary.competitionGroupsTrue += 1;
    else if (rolledUp === false) summary.competitionGroupsFalse += 1;
    else summary.competitionGroupsNull += 1;

    if (group.isFemale !== rolledUp) {
      summary.competitionGroupsUpdated += 1;
      if (!options.dryRun) {
        await prisma.competitionGroup.update({
          where: { id: group.id },
          data: { isFemale: rolledUp },
        });
      }
    }
  }

  const hasFemaleCompetitionWhere = {
    teamSeasons: {
      some: {
        apiCompetition: {
          isFemale: true,
        },
      },
    },
  } as const;

  const hasMaleCompetitionWhere = {
    teamSeasons: {
      some: {
        apiCompetition: {
          isFemale: false,
        },
      },
    },
  } as const;

  const femaleUpdateWhere = {
    isFemale: { not: true },
    ...hasFemaleCompetitionWhere,
  } as const;

  const maleUpdateWhereAfterFemale = {
    isFemale: null,
    ...hasMaleCompetitionWhere,
    NOT: [hasFemaleCompetitionWhere],
  } as const;

  const defaultMaleWhereAfterFemaleAndMale = {
    isFemale: null,
    NOT: [hasFemaleCompetitionWhere, hasMaleCompetitionWhere],
  } as const;

  summary.teamsSetFemaleFromParticipation = await prisma.team.count({ where: femaleUpdateWhere });
  summary.teamsSetMaleFromParticipation = await prisma.team.count({ where: maleUpdateWhereAfterFemale });
  summary.teamsDefaultedMale = await prisma.team.count({ where: defaultMaleWhereAfterFemaleAndMale });

  if (!options.dryRun) {
    await prisma.team.updateMany({ where: femaleUpdateWhere, data: { isFemale: true } });
    await prisma.team.updateMany({ where: maleUpdateWhereAfterFemale, data: { isFemale: false } });
    await prisma.team.updateMany({ where: defaultMaleWhereAfterFemaleAndMale, data: { isFemale: false } });
  }

  const teamStatsAfter = await prisma.team.groupBy({
    by: ['isFemale'],
    _count: { _all: true },
  });

  summary.teamsAfter = mapCountRows(teamStatsAfter);

  console.log('Gender attribution summary:');
  console.log(`- Mode: ${summary.dryRun ? 'dry-run' : 'execute'}`);
  console.log(`- ApiCompetition total: ${summary.apiCompetitionsTotal}`);
  console.log(`- ApiCompetition updated: ${summary.apiCompetitionsUpdated}`);
  console.log(`- ApiCompetition reasons: ${JSON.stringify(summary.apiCompetitionReasonCounts)}`);
  console.log(`- CompetitionGroup total: ${summary.competitionGroupsTotal}`);
  console.log(`- CompetitionGroup updated: ${summary.competitionGroupsUpdated}`);
  console.log(`- CompetitionGroup rollup true/false/null: ${summary.competitionGroupsTrue}/${summary.competitionGroupsFalse}/${summary.competitionGroupsNull}`);
  console.log(`- Team counts before (f/m/u): ${summary.teamsBefore.female}/${summary.teamsBefore.male}/${summary.teamsBefore.unknown}`);
  console.log(`- Team updates from participation (female): ${summary.teamsSetFemaleFromParticipation}`);
  console.log(`- Team updates from participation (male): ${summary.teamsSetMaleFromParticipation}`);
  console.log(`- Team defaults to male: ${summary.teamsDefaultedMale}`);
  console.log(`- Team counts after (f/m/u): ${summary.teamsAfter.female}/${summary.teamsAfter.male}/${summary.teamsAfter.unknown}`);

  await prisma.$disconnect();
}

run().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
