import { CupRound, SeasonInput, SeasonSummary } from "@/lib/types/prisma/Season";
import { Prisma } from "../../../prisma/generated/client";
import { prisma } from "./prisma";

const seasonSummaryInclude = {
  team: true,
  leagueResult: { include: { competition: true } },
  cupResults: { include: { competition: true } },
};

export class SeasonValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SeasonValidationError";
  }
}

type PersistableCupResult = {
  competitionId: number;
  reachedRound: CupRound;
};

export function validateLeagueInputShape(input: Pick<SeasonInput, "leagueId" | "leaguePosition">): void {
  const hasLeagueId = Boolean(input.leagueId);
  const hasLeaguePosition = input.leaguePosition !== undefined && input.leaguePosition !== null;
  if (hasLeagueId !== hasLeaguePosition) {
    throw new SeasonValidationError("leagueId and leaguePosition must either both be provided or both be omitted");
  }
}

export function normalizeCupResultsStrict(cupResults: SeasonInput["cupResults"] | undefined): PersistableCupResult[] {
  if (!cupResults?.length) return [];

  const dedupedByCompetition = new Map<number, PersistableCupResult>();
  cupResults.forEach((cup, index) => {
    const competitionId = Number(cup.competitionId);
    if (!Number.isInteger(competitionId) || competitionId <= 0) {
      throw new SeasonValidationError(`Cup result at index ${index} has an invalid competitionId`);
    }

    dedupedByCompetition.set(competitionId, {
      competitionId,
      reachedRound: cup.reachedRound || "Group Stage",
    });
  });

  return Array.from(dedupedByCompetition.values());
}

export function isCupWinningRound(reachedRound: string | null | undefined): boolean {
  if (!reachedRound) return false;

  const normalized = reachedRound
    .trim()
    .toLowerCase()
    .replace(/[-_\s]+/g, ' ');

  return normalized === 'winners'
    || normalized === 'winner'
    || normalized === 'champions'
    || normalized === 'champion'
    || normalized === 'won';
}

export async function syncSeasonCompetitionData(
  tx: Prisma.TransactionClient,
  seasonId: number,
  input: Pick<SeasonInput, "leagueId" | "leaguePosition" | "promoted" | "relegated" | "cupResults">
): Promise<PersistableCupResult[]> {
  validateLeagueInputShape(input);
  const cups = normalizeCupResultsStrict(input.cupResults);

  const hasLeagueId = Boolean(input.leagueId);
  const hasLeaguePosition = input.leaguePosition !== undefined && input.leaguePosition !== null;

  if (hasLeagueId && hasLeaguePosition) {
    await tx.leagueResult.upsert({
      where: { seasonId },
      create: {
        seasonId,
        competitionId: Number(input.leagueId),
        position: Number(input.leaguePosition),
        promoted: input.promoted || false,
        relegated: input.relegated || false,
      },
      update: {
        competitionId: Number(input.leagueId),
        position: Number(input.leaguePosition),
        promoted: input.promoted || false,
        relegated: input.relegated || false,
      },
    });
  } 
  else await tx.leagueResult.deleteMany({ where: { seasonId } });

  await tx.cupResult.deleteMany({ where: { seasonId } });
  if (cups.length > 0) {
    await tx.cupResult.createMany({
      data: cups.map((cup) => ({
        seasonId,
        competitionId: cup.competitionId,
        reachedRound: cup.reachedRound,
      })),
      skipDuplicates: true,
    });
  }

  return cups;
}

export async function getSaveSeasons(saveId: string): Promise<SeasonSummary[]> {
  return await prisma.season.findMany({
    where: { saveId },
    include: seasonSummaryInclude,
  });
}

export async function getSeasonById(seasonId: number): Promise<SeasonSummary | null> {
  return await prisma.season.findUnique({
    where: { id: seasonId },
    include: seasonSummaryInclude,
  });
}

export async function getUserSeasons(uid: string): Promise<SeasonSummary[]> {
  return await prisma.season.findMany({
    where: { save: { userId: uid } },
    include: seasonSummaryInclude,
  });
}

export async function countUserSeasons(uid: string): Promise<number> {
  return await prisma.season.count({
    where: { save: { userId: uid } },
  });
}