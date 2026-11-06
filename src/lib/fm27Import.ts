export const fm27LeagueAdditions = [
  { id: 307, name: 'Saudi Pro League', countryCode: 'SA', tier: 1, isFemale: false },
  { id: 64, name: 'Feminine Division 1', countryCode: 'FR', tier: 1, isFemale: true },
  { id: 111, name: 'FAW Championship', countryCode: 'GB-WLS', tier: 2, isFemale: false },
  { id: 289, name: '1st Division', countryCode: 'ZA', tier: 2, isFemale: false },
] as const;

export function getImportApiSeason(leagueId: number, year: number, fm27: boolean): number {
  return fm27 && year === 2026 && leagueId === 98 ? 2027 : year;
}

export function includeImportLeague(leagueId: number, type: string, fm27: boolean): boolean {
  return type === 'DOMESTIC_LEAGUE' && (!fm27 || ![561, 1032, 270].includes(leagueId));
}

export function includeImportTeam(leagueId: number, teamId: number, year: number, fm27: boolean): boolean {
  if (!fm27 || year !== 2026) return true;
  return !(leagueId === 357 && teamId === 3844)
    && !(leagueId === 104 && [7001, 16217].includes(teamId));
}

export function getTeamCoordinateUpdate(lat?: number | null, lng?: number | null): { lat?: number; lng?: number } {
  return {
    ...(lat != null ? { lat } : {}),
    ...(lng != null ? { lng } : {}),
  };
}
