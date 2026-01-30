import { prisma } from "@/lib/db/prisma";
import { Team } from "@/lib/types/prisma/Team";

export async function getTeamData(teamId: number): Promise<Team | null> {
  return await prisma.team.findUnique({
    where: { id: teamId }
  })
}