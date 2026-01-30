import { Trophy, TrophyGroup } from "../types/firebase/Trophy";

export function groupTrophies(trophies: Trophy[]): TrophyGroup[] {
  const groupedTrophies: TrophyGroup[] = [];

  trophies.forEach((trophy) => {
    const group = groupedTrophies.find((g) => g.competitionId === trophy.competitionId);
    if (group) {
      group.trophies.push(trophy);
    } else {
      groupedTrophies.push({
        competitionId: trophy.competitionId,
        competitionName: trophy.competitionName,
        competitionLogo: trophy.competitionLogo,
        competitionType: trophy.competitionType,
        trophies: [trophy],
      });
    }
  });

  return groupedTrophies;
}