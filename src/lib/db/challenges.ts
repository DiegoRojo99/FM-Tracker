import { CareerChallenge, CareerChallengeGoalInput, CareerChallengeWithDetails, CareerChallengeWithSaveDetails, ChallengeGoalWithDetails, ChallengeWithGoals } from '../types/prisma/Challenge';
import { getTrophiesForSave } from './trophies';
import { dedupeTrophiesForChallengeEvaluation } from '../challenges/progression';
import { challengeGoalToCareerChallengeGoal } from '../dto/challenges';
import { evaluateAchievementsForUser } from './achievements';
import { prisma } from './prisma';
import { getSaveById } from './saves';
import { Trophy } from '../../../prisma/generated/client';

const ChallengeGoalWithDetailsInclude = {
  competition: true,
  country: true,
  teams: {
    include: {
      team: true
    }
  },
};

const CareerChallengeWithDetailsInclude = {
  challenge: {
    include: {
      goals: {
        include: ChallengeGoalWithDetailsInclude
      }
    }
  },
  goalProgress: true,
  game: true,
  save: true
};

type TrophyMatchContext = {
  competitionNameById: Map<number, string>;
  competitionCountryById: Map<number, string>;
  teamCountryById: Map<number, string>;
};

export async function getAllChallenges(): Promise<ChallengeWithGoals[]> {
  return await prisma.challenge.findMany({
    include: {
      goals: {
        include: ChallengeGoalWithDetailsInclude
      }
    },
  });
}

export async function getChallengeById(challengeId: number): Promise<ChallengeWithGoals | null> {
  return await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: {
      goals: {
        include: ChallengeGoalWithDetailsInclude
      }
    },
  });
}

export async function getUserChallenges(userId: string): Promise<CareerChallengeWithDetails[]> {
  return await prisma.careerChallenge.findMany({
    where: { userId },
    include: CareerChallengeWithDetailsInclude
  });
}

export async function getUserChallengesByChallenge(challengeId: number, userId: string): Promise<CareerChallengeWithSaveDetails[]> {
  return await prisma.careerChallenge.findMany({
    where: { challengeId, userId },
    include: CareerChallengeWithDetailsInclude,
    orderBy: { startedAt: 'desc' } // Most recent first
  });
}

// Keep the old function name for backward compatibility, but fix the query
export async function getUserChallengeById(challengeId: number, userId: string): Promise<CareerChallengeWithDetails | null> {
  return await prisma.careerChallenge.findFirst({
    where: { challengeId, userId },
    include: CareerChallengeWithDetailsInclude,
    orderBy: { startedAt: 'desc' } // Get the most recent one
  });
}

export async function getTeamMatchingChallenges(teamId: number) {
  const challenges = await getAllChallenges();
  return challenges.filter(challenge => 
    challenge.goals.some(goal => 
      goal.teams.some(team => 
        team.teamId === teamId
      )
    )
  );
}

export async function getCountryMatchingChallenges(countryCode: string | undefined) {
  if (!countryCode) return [];
  const challenges = await getAllChallenges();
  return challenges.filter(challenge => 
    challenge.goals.some(goal => 
      goal.country?.code === countryCode
    )
  );
}

export async function getCompetitionMatchingChallenges(competitionId: number) {
  const challenges = await getAllChallenges();
  return challenges.filter(challenge => 
    challenge.goals.some(goal => 
      goal.competition?.id === competitionId
    )
  );
}

export async function getChallengesForSave(saveId: string): Promise<CareerChallenge[]> {
  return await prisma.careerChallenge.findMany({
    where: { saveId },
  });
}

export async function checkForMatchingChallenges(trophyData: Trophy, context: TrophyMatchContext) {

  // Get all challenges and filter them based on whether AT LEAST ONE goal can be fully satisfied
  const allChallenges = await getAllChallenges();
  const matchingChallenges = allChallenges.filter(challenge => {
    return challenge.goals.some(goal => filterGoalByTrophy(goal, trophyData, context));
  });

  return matchingChallenges;
}

/* Checks for matching challenges and adds them to the user's save */
export async function addChallengeForTrophy(
  uid: string,
  saveId: string,
  trophyData: Trophy
): Promise<void> {
  const saveTrophies = await getTrophiesForSave(saveId);
  if (!saveTrophies.includes(trophyData)) saveTrophies.push(trophyData);

  const uniqueTrophies = dedupeTrophiesForChallengeEvaluation([...saveTrophies, trophyData]);
  const competitionIds = [...new Set(uniqueTrophies.map((trophy) => trophy.competitionGroupId))];
  const teamIds = [...new Set(uniqueTrophies.map((trophy) => trophy.teamId))];

  const [competitions, teams] = await Promise.all([
    prisma.competitionGroup.findMany({
      where: { id: { in: competitionIds } },
      select: { id: true, name: true, countryCode: true },
    }),
    prisma.team.findMany({
      where: { id: { in: teamIds } },
      select: { id: true, countryCode: true },
    }),
  ]);

  const context: TrophyMatchContext = {
    competitionNameById: new Map(competitions.map((competition) => [competition.id, competition.name])),
    competitionCountryById: new Map(
      competitions
        .filter((competition): competition is typeof competition & { countryCode: string } => !!competition.countryCode)
        .map((competition) => [competition.id, competition.countryCode])
    ),
    teamCountryById: new Map(
      teams
        .filter((team): team is typeof team & { countryCode: string } => !!team.countryCode)
        .map((team) => [team.id, team.countryCode])
    ),
  };

  const matchingChallenges = await checkForMatchingChallenges(trophyData, context);

  for (const challenge of matchingChallenges) {
    const processedGoals: CareerChallengeGoalInput[] = filterCompletedChallengeGoalsBasedOnTrophies(
      challenge,
      uniqueTrophies,
      context
    );

    await upsertCareerChallenge(uid, saveId, trophyData.gameId, challenge.id, processedGoals);
  }
}

export async function addChallengeForTeam(
  saveId: string,
  teamId: number
): Promise<void> {
  const matchingChallenges = await getTeamMatchingChallenges(Number(teamId));
  await addNewEmptyCareerChallenges(saveId, matchingChallenges);
}

export async function addChallengeForCountry(
  saveId: string,
  countryCode: string
): Promise<void> {
  const matchingChallenges = await getCountryMatchingChallenges(countryCode);
  await addNewEmptyCareerChallenges(saveId, matchingChallenges);
}

export async function addNewEmptyCareerChallenges(
  saveId: string,
  challenges: ChallengeWithGoals[]
): Promise<void> {
  const save = await getSaveById(saveId);
  if (!save) return;

  const userChallenges = await getChallengesForSave(saveId);
  const nonExistingChallenges: ChallengeWithGoals[] = challenges.filter(challenge => 
    !userChallenges.some(c => c.challengeId === challenge.id)
  );

  const careerChallengesData: Omit<CareerChallenge, 'id'>[] = nonExistingChallenges.map(challenge => ({
    saveId: save.id,
    userId: save.userId,
    gameId: save.gameId,
    challengeId: challenge.id,
    startedAt: new Date(),
    completedAt: null,
  }));

  await prisma.careerChallenge.createMany({
    data: careerChallengesData,
  });
}

export async function upsertCareerChallenge(
  uid: string,
  saveId: string,
  gameId: string,
  challengeId: number,
  goalProgress: CareerChallengeGoalInput[]
): Promise<CareerChallengeWithDetails> {
  // Prepare the userChallenge object
  const userChallenge: Omit<CareerChallenge, 'id'> = {
    userId: uid,
    challengeId: challengeId,
    gameId: gameId,
    saveId: saveId,
    startedAt: new Date(),
    completedAt: goalProgress.every(goal => goal.isComplete) ? new Date() : null,
  }

  // Upsert CareerChallenge
  const existingChallenge = await prisma.careerChallenge.findFirst({
    where: {
      userId: userChallenge.userId,
      saveId: userChallenge.saveId,
      challengeId: userChallenge.challengeId,
    }
  });

  let savedChallenge: CareerChallenge;
  if (existingChallenge) {
    savedChallenge = await prisma.careerChallenge.update({
      where: { id: existingChallenge.id },
      data: userChallenge,
    });
  } 
  else {
    savedChallenge = await prisma.careerChallenge.create({
      data: userChallenge,
    });
  }

  // Upsert CareerChallengeGoal progress
  for (const goal of goalProgress) {
    const existingGoal = await prisma.careerChallengeGoal.findFirst({
      where: {
        careerChallengeId: savedChallenge.id,
        challengeGoalId: goal.challengeGoalId,
      }
    });
    if (existingGoal) {
      await prisma.careerChallengeGoal.update({
        where: { id: existingGoal.id },
        data: goal,
      });
    }
    else {
      await prisma.careerChallengeGoal.create({
        data: {
          ...goal,
          careerChallengeId: savedChallenge.id,
        }
      });
    }
  }

  await evaluateAchievementsForUser({
    userId: uid,
    saveId,
    gameId,
    eventType: 'challenge.progress.updated',
    eventTimestamp: new Date(),
  });

  // Return the full CareerChallengeWithDetails
  return await prisma.careerChallenge.findUnique({
    where: { id: savedChallenge.id },
    include: CareerChallengeWithDetailsInclude,
  }) as CareerChallengeWithDetails;
}

/* FILTERS */

export function filterCompletedChallengeGoalsBasedOnTrophies(
  challenge: ChallengeWithGoals,
  trophies: Trophy[],
  context: TrophyMatchContext
): CareerChallengeGoalInput[] {
  const uniqueTrophies = dedupeTrophiesForChallengeEvaluation(trophies);

  return challenge.goals.map((goal) => {
    const isCompleted = uniqueTrophies.some((trophy) => filterGoalByTrophy(goal, trophy, context));
    return challengeGoalToCareerChallengeGoal({ goal, isCompleted });
  });
}

function filterGoalByTrophy(
  goal: ChallengeGoalWithDetails,
  trophy: Trophy,
  context: TrophyMatchContext
): boolean {
  if (goal.competitionId && goal.competitionId !== trophy.competitionGroupId) {
    const goalCompetitionName = goal.competition?.name ?? goal.description;
    const trophyCompetitionName = context.competitionNameById.get(trophy.competitionGroupId);

    const matchesByNormalizedName =
      !!goalCompetitionName &&
      !!trophyCompetitionName &&
      normalizeCompetitionName(goalCompetitionName) === normalizeCompetitionName(trophyCompetitionName);

    const matchesByCompetitionFamily =
      !!goalCompetitionName &&
      !!trophyCompetitionName &&
      getCompetitionFamily(goalCompetitionName) !== null &&
      getCompetitionFamily(goalCompetitionName) === getCompetitionFamily(trophyCompetitionName);

    if (!matchesByNormalizedName && !matchesByCompetitionFamily) {
      return false;
    }
  }

  if (goal.teams?.length && goal.teams.every(team => team.teamId !== trophy.teamId)) {
    return false;
  }

  if (goal.country) {
    const trophyCountryCodes = getCountryCodesForTrophy(trophy, context);
    if (!trophyCountryCodes.includes(goal.country.code)) {
      return false;
    }
  }

  return true;
}

function getCountryCodesForTrophy(trophy: Trophy, context: TrophyMatchContext): string[] {
  const codes = [
    context.competitionCountryById.get(trophy.competitionGroupId),
    context.teamCountryById.get(trophy.teamId),
  ].filter((code): code is string => typeof code === 'string' && code.length > 0);

  return [...new Set(codes)];
}

function normalizeCompetitionName(name: string): string {
  return name
    .toLowerCase()
    .replace(/uefa/g, '')
    .replace(/europa\s+conference/g, 'conference')
    .replace(/champions\s+league/g, 'championsleague')
    .replace(/europa\s+league/g, 'europaleague')
    .replace(/conference\s+league/g, 'conferenceleague')
    .replace(/[^a-z0-9]/g, '');
}

function getCompetitionFamily(name: string): 'champions' | 'europa' | 'conference' | null {
  const normalized = normalizeCompetitionName(name);

  if (normalized.includes('championsleague')) return 'champions';
  if (normalized.includes('europaleague')) return 'europa';
  if (normalized.includes('conferenceleague') || normalized.includes('conference')) return 'conference';

  return null;
}
