import { FullCareerStint } from "@/lib/types/prisma/Career";
import { prisma } from "./prisma";
import { Team } from "../../../prisma/generated/client";

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

export async function getUserMostUsedTeams(uid: string): Promise<Team[]> {
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
  });

  if (result.length === 0) return [];
  
  // Find the maximum count
  const maxCount = result[0]._count.teamId;
  
  // Get all teams with the maximum count
  const topTeamIds = result
    .filter(item => item._count.teamId === maxCount)
    .map(item => item.teamId)
    .filter((teamId): teamId is number => teamId !== null);

  if (topTeamIds.length === 0) return [];

  const teams: Team[] = await prisma.team.findMany({ 
    where: { 
      id: { 
        in: topTeamIds 
      } 
    } 
  });
  
  return teams;
}