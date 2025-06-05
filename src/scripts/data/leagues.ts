

const seededLeaguesIds = [39, 135, 78, 271, 61, 140, 88, 113, 180, 40, 183, 144, 41, 42, 62, 253, 272, 179, 43, 94, 141, 95, 136, 207, 197, 119, 203];
const seededLeagues = seededLeaguesIds.map(id => {
  return {
    id,
    season: 2023,
  };
});

const ids: number[] = [];
const leaguesToSeed = ids.map(id => {
  return {
    id,
    season: 2023,
  };
});

export { seededLeagues, leaguesToSeed };