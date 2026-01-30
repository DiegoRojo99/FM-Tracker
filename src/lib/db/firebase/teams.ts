import { Team } from "../../types/prisma/Team";
import { prisma } from "../prisma";

export async function fetchTeam(teamId: number): Promise<Team | null> {
  return await prisma.team.findFirst({
    where: { id: teamId }
  })
}

export async function getTeamsByIds(ids: number[]): Promise<Team[]> {
  return await prisma.team.findMany({
    where: { id: { in: ids } }
  })
}

export async function getAllTeams(): Promise<Team[]> {
  return await prisma.team.findMany();
}