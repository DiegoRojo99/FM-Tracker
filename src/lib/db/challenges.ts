import { CareerChallenge, CareerChallengeGoalInput, CareerChallengeWithDetails, CareerChallengeWithSaveDetails, ChallengeGoalWithDetails, ChallengeWithGoals } from '../types/prisma/Challenge';
import { challengeGoalToCareerChallengeGoal } from '../dto/challenges';
import { getTrophiesForSave } from './trophies';
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

export async function checkForMatchingChallenges(trophyData: Trophy) {
  const countryCode = await prisma.competitionGroup.findUnique({
    where: { id: trophyData.competitionGroupId },
  }).then(comp => comp?.countryCode);

  // Get all challenges and filter them based on whether AT LEAST ONE goal can be fully satisfied
  const allChallenges = await getAllChallenges();
  const matchingChallenges = allChallenges.filter(challenge => {
    return challenge.goals.some(goal => filterGoalByTrophy(goal, trophyData, countryCode));
  });

  return matchingChallenges;
}

/* Checks for matching challenges and adds them to the user's save */
export async function addChallengeForTrophy(
  uid: string,
  saveId: string,
  trophyData: Trophy,
  countryCode?: string
): Promise<void> {
  const matchingChallenges = await checkForMatchingChallenges(trophyData);
  const saveTrophies = await getTrophiesForSave(saveId);
  if (!saveTrophies.includes(trophyData)) saveTrophies.push(trophyData);

  for (const challenge of matchingChallenges) {
    const processedGoals: CareerChallengeGoalInput[] = filterCompletedChallengeGoalsBasedOnTrophies(
      challenge,
      [...saveTrophies, trophyData],
      countryCode
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
  countryCode?: string
): CareerChallengeGoalInput[] {
  const goals: CareerChallengeGoalInput[] = [];
  
  for (const goal of challenge.goals) {
    const isCompleted = trophies.some(trophy => filterGoalByTrophy(goal, trophy, countryCode));
    const careerGoal = challengeGoalToCareerChallengeGoal({ goal, isCompleted });
    goals.push(careerGoal);
  }

  return goals;
}

function filterGoalByTrophy(
  goal: ChallengeGoalWithDetails,
  trophy: Trophy,
  countryCode?: string
): boolean {
  if (goal.competitionId && goal.competitionId !== trophy.competitionGroupId) {
    return false;  
  }
  if (goal.teams?.length && goal.teams.every(team => team.teamId !== trophy.teamId)) {
    return false;
  }
  if (goal.countryId && goal.countryId !== countryCode) {
    return false;
  }
  return true;
}
