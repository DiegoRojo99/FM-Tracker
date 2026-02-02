import { FullCareerStint } from "@/lib/types/prisma/Career";
import { prisma } from "../prisma";
import { Team } from "../../../../prisma/generated/client";

export async function getSaveCareer(saveId: string): Promise<FullCareerStint[]> {
  return await prisma.careerStint.findMany({
    where: { saveId },
    include: { team: true },
  });
}

export async function getCareerStintById(careerId: number): Promise<FullCareerStint | null> {
  return await prisma.careerStint.findUnique({
    where: { id: careerId },
    include: { team: true },
  });
}

export async function getUserCareerStints(uid: string): Promise<FullCareerStint[]> {
  return await prisma.careerStint.findMany({
    where: { save: { userId: uid } },
    include: { team: true },
  });
}

export async function countUserCareerStints(uid: string): Promise<number> {
  return await prisma.careerStint.count({
    where: { save: { userId: uid } },
  });
}

export async function countUserCareerStintsByTeam(uid: string, teamId: number): Promise<number> {
  return await prisma.careerStint.count({
    where: { teamId, save: { userId: uid } },
  });
}

export async function getUserMostUsedTeam(uid: string): Promise<Team | null> {
   const result = await prisma.careerStint.groupBy({
    by: ['teamId'],
    where: { save: { userId: uid }},
    _count: {
      teamId: true,
    },
    orderBy: {
      _count: {
        teamId: 'desc',
      },
    },
    take: 1,
  });

  if (result.length === 0) return null;
  const teamId = result[0].teamId;
  if (teamId === null) return null;

  const team: Team | null = await prisma.team.findUnique({ where: { id: teamId } });
  return team;
}