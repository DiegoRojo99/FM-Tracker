import { Team } from "../types/prisma/Team";
import { prisma } from "./prisma";

export async function fetchTeam(teamId: number): Promise<Team | null> {
  return await prisma.team.findUnique({
    where: {
      id: teamId,
    },
  });
}

export async function fetchTeamsByName(name: string): Promise<Team[]> {
  return await prisma.team.findMany({
    where: {
      name: {
        contains: name,
        mode: "insensitive",
      },
    },
  });
}

export async function fetchTeamsByIds(ids: number[]) {
  return await prisma.team.findMany({
    where: {
      id: {
        in: ids,
      },
    },
  });
}

export async function fetchAllTeams() {
  return await prisma.team.findMany();
}