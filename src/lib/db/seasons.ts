import { SeasonSummary } from "@/lib/types/prisma/Season";
import { prisma } from "./prisma";

const seasonSummaryInclude = {
  team: true,
  leagueResult: { include: { competition: true } },
  cupResults: { include: { competition: true } },
};

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