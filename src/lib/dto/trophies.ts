import { FullTrophy, TrophyGroup } from "../types/prisma/Trophy";

export function groupTrophies(trophies: FullTrophy[]): TrophyGroup[] {
  const groupedTrophies: TrophyGroup[] = [];

  trophies.forEach((trophy) => {
    const group = groupedTrophies.find((g) => g.competitionGroup.id === trophy.competitionGroup.id);
    if (group) {
      group.trophies.push(trophy);
    } 
    else {
      groupedTrophies.push({
        competitionGroup: trophy.competitionGroup,
        trophies: [trophy],
      });
    }
  });

  return groupedTrophies;
}