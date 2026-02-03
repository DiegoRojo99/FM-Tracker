import { fetchCompetition } from "./competitions";
import { FullDetailsSave, PreviewSave } from "../types/prisma/Save";
import { prisma } from "./prisma";
import { Team } from "@/lib/types/prisma/Team";
import { CompetitionGroup } from "../../../prisma/generated/client";


/**
 * Updates the 'season' attribute of a save document for a user in Firestore.
 * @param userId - The user's ID.
 * @param saveId - The save's ID.
 * @param season - The new season value.
 */
export async function updateSaveSeason(userId: string, saveId: string, season: string) {
  const save = await getSaveById(saveId);
  if (!save || save.userId !== userId) return false;
  const updatedSave = await prisma.save.update({
    where: { id: saveId },
    data: {
      season: season,
    },
  });
  return !!updatedSave;
}

/**
 * Updates the 'season' attribute of a save document for a user in Firestore.
 * @param saveId - The save's ID.
 * @param currentLeagueId - The ID of the current league.
 */
export async function updateSaveCurrentLeague( saveId: string, currentLeagueId: number): Promise<boolean> {
  const currentLeague: CompetitionGroup | null = await fetchCompetition(currentLeagueId);
  if (!currentLeague) return false;

  const save = await getSaveById(saveId);
  if (!save) return false;

  const updatedSave = await prisma.save.update({
    where: { id: saveId },
    data: {
      currentLeagueId: currentLeague.id,
    },
  });

  return !!updatedSave;
}

export async function getSaveById(saveId: string) {
  return await prisma.save.findUnique({
    where: { id: saveId },
  });
}

export async function getPreviewSaveById(saveId: string): Promise<PreviewSave | null> {
  return await prisma.save.findUnique({
    where: {
      id: saveId,
    },
    include: {
      currentClub: true,
      currentNT: true,
      currentLeague: true,
      game: true,
    },
  });
}

export async function getFullSave(saveId: string): Promise<FullDetailsSave | null> {
  return await prisma.save.findUnique({
    where: {
      id: saveId,
    },
    include: {
      currentLeague: true,
      currentClub: true,
      currentNT: true,
      game: true,
      careerStints: {
        include: {
          team: true,
        },
      },
      trophies: {
        include: {
          team: true,
          competitionGroup: true,
        },
      },
      seasons: {
        include: {
          team: true,
          leagueResult: {include: {competition: true}},
          cupResults: {include: {competition: true}},
        },
      },
      challenges: {
        include: {
          challenge: {
            include: {
              goals: {
                include: {
                  competition: true,
                  country: true,
                  teams: true,
                },
              },
            },
          },
          goalProgress: true,
          game: true,
        },
      }
    },
  });
}

export async function getUserPreviewSaves(userId: string): Promise<PreviewSave[]> {
  return await prisma.save.findMany({
    where: { userId: userId },
    include: {
      currentClub: true,
      currentNT: true,
      currentLeague: true,
      game: true,
    },
  });
}

export async function getFullUserSaves(userId: string): Promise<FullDetailsSave[]> {
  return await prisma.save.findMany({
    where: {
      userId: userId,
    },
    include: {
      currentLeague: true,
      currentClub: true,
      currentNT: true,
      game: true,
      careerStints: {
        include: {
          team: true,
        },
      },
      trophies: {
        include: {
          team: true,
          competitionGroup: true,
        },
      },
      seasons: {
        include: {
          team: true,
          leagueResult: {include: {competition: true}},
          cupResults: {include: {competition: true}},
        },
      },
      challenges: {
        include: {
          challenge: {
            include: {
              goals: {
                include: {
                  competition: true,
                  country: true,
                  teams: true,
                },
              },
            },
          },
          goalProgress: true,
          game: true,
        },
      }
    },
  });
}
export async function countUserSaves(userId: string): Promise<number> {
  return await prisma.save.count({
    where: {
      userId: userId,
    },
  });
}

export async function getAllFullSaves(): Promise<FullDetailsSave[] | null> {
  return await prisma.save.findMany({
    include: {
      currentLeague: true,
      currentClub: true,
      currentNT: true,
      game: true,
      careerStints: {
        include: {
          team: true,
        },
      },
      trophies: {
        include: {
          team: true,
          competitionGroup: true,
        },
      },
      seasons: {
        include: {
          team: true,
          leagueResult: {include: {competition: true}},
          cupResults: {include: {competition: true}},
        },
      },
      challenges: {
        include: {
          challenge: {
            include: {
              goals: {
                include: {
                  competition: true,
                  country: true,
                  teams: true,
                },
              },
            },
          },
          goalProgress: true,
          game: true,
        },
      }
    },
  });
}

export async function getAllTeamsInSaves(): Promise<Team[]> {
  const saves = await prisma.save.findMany({
    include: {
      careerStints: {
        include: {
          team: true,
        },
      },
    },
  });

  const teams: Team[] = saves.flatMap(save => 
    save.careerStints.map(stint => stint.team)
  );

  const uniqueTeams = new Map<number, Team>();
  teams.forEach(team => {
    if (!uniqueTeams.has(team.id)) {
      uniqueTeams.set(team.id, team);
    }
  });
  
  return Array.from(uniqueTeams.values());
}