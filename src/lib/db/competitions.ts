import { prisma } from '@/lib/db/prisma';
import { CompetitionGroup } from '../../../prisma/generated/client';

export async function fetchCompetition(competitionId: string): Promise<CompetitionGroup | null> {
  const competition = await prisma.competitionGroup.findUnique({
    where: {
      id: Number(competitionId),
    },
  });

  return competition;
}