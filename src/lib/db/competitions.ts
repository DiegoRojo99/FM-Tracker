import { prisma } from '@/lib/db/prisma';
import { CompetitionGroup } from '../../../prisma/generated/client';

export async function fetchCompetition(competitionId: number): Promise<CompetitionGroup | null> {
  const competition = await prisma.competitionGroup.findUnique({
    where: {
      id: competitionId,
    },
  });

  return competition;
}