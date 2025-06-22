

const seededLeaguesIds = [
  39, 135, 78, 271, 61, 140, 88, 113, 180, 40, 183, 144, 41, 42, 62, 253, 272, 179, 43, 94,
  141, 95, 136, 207, 197, 119, 203, 15, 22, 36, 6, 7, 960, 563, 564, 79, 80
];
const seededLeagues = seededLeaguesIds.map(id => {
  return {
    id,
    season: 2023,
  };
});

const ids: number[] = [218, 71, 72, 98, 99, 100];
const leaguesToSeed = ids.map(id => {
  return {
    id,
    season: 2023,
  };
});

export { seededLeagues, leaguesToSeed };