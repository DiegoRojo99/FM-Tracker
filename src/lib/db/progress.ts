import type { AchievementEventType } from '../achievements/catalog';
import { evaluateAchievementsForUser } from './achievements';
import { getAllChallenges, getChallengeIdsForTeamsOrCountries, syncChallengeRunsForSave } from './challenges';
import { prisma } from './prisma';
import { withSaveProgressLock } from './saveLock';

// Events that can only increase counts; anything else (edits/deletes) re-evaluates every achievement.
const ADDITIVE_EVENTS: ReadonlySet<AchievementEventType> = new Set([
  'save.created',
  'season.created',
  'trophy.added',
  'challenge.progress.updated',
]);

type RecomputeSaveProgressInput = {
  userId: string;
  saveId: string;
  eventType: AchievementEventType;
  gameId?: string;
  /** Teams/countries the user just started managing; matching challenges get a run even with no progress yet. */
  ensureForTeamIds?: number[];
  ensureForCountryCodes?: string[];
};

/*
 * Single entry point to refresh challenge runs and achievements after any change to a save.
 * Safe to call after creates, edits and deletes: everything is derived from current DB state.
 */
export async function recomputeSaveProgress(input: RecomputeSaveProgressInput): Promise<void> {
  const { userId, saveId, eventType } = input;

  await withSaveProgressLock(saveId, async () => {
    let gameId = input.gameId;
    if (!gameId) {
      const save = await prisma.save.findUnique({ where: { id: saveId }, select: { gameId: true } });
      if (!save) {
        await recomputeUserProgress({ userId, eventType });
        return;
      }
      gameId = save.gameId;
    }

    const challenges = await getAllChallenges();
    const ensureChallengeIds = getChallengeIdsForTeamsOrCountries(
      challenges,
      input.ensureForTeamIds ?? [],
      input.ensureForCountryCodes ?? []
    );

    const challengeResult = await syncChallengeRunsForSave({
      userId,
      saveId,
      gameId,
      challenges,
      ensureChallengeIds,
    });

    const challengesChanged = challengeResult.created > 0 || challengeResult.updated > 0;

    await evaluateAchievementsForUser({
      userId,
      saveId,
      gameId,
      eventType,
      eventTimestamp: new Date(),
      // Challenge changes can affect challenge-based achievements regardless of the triggering event.
      evaluateAll: !ADDITIVE_EVENTS.has(eventType) || challengesChanged,
    });
  });
}

/* For user-level changes with no surviving save (e.g. save deleted). */
export async function recomputeUserProgress(input: { userId: string; eventType: AchievementEventType }): Promise<void> {
  await evaluateAchievementsForUser({
    userId: input.userId,
    eventType: input.eventType,
    eventTimestamp: new Date(),
    evaluateAll: true,
  });
}

/* Never let progress recomputation fail the user's request. */
export async function safeRecomputeSaveProgress(input: RecomputeSaveProgressInput): Promise<void> {
  try {
    await recomputeSaveProgress(input);
  } catch (error) {
    console.error(`Progress recompute failed for save ${input.saveId} (${input.eventType}):`, error);
  }
}

export async function safeRecomputeUserProgress(input: { userId: string; eventType: AchievementEventType }): Promise<void> {
  try {
    await recomputeUserProgress(input);
  } catch (error) {
    console.error(`Progress recompute failed for user ${input.userId} (${input.eventType}):`, error);
  }
}
