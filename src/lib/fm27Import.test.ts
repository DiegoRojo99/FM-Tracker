import { describe, expect, it } from 'vitest';
import { getImportApiSeason, getTeamCoordinateUpdate, includeImportLeague, includeImportTeam } from './fm27Import';

describe('FM27 import policy', () => {
  it('preserves stored coordinates when API values are absent, including partial coordinates', () => {
    expect(getTeamCoordinateUpdate()).toEqual({});
    expect(getTeamCoordinateUpdate(null, null)).toEqual({});
    expect(getTeamCoordinateUpdate(0, undefined)).toEqual({ lat: 0 });
    expect(getTeamCoordinateUpdate(null, -3.5)).toEqual({ lng: -3.5 });
    expect(getTeamCoordinateUpdate(51.5, -0.1)).toEqual({ lat: 51.5, lng: -0.1 });
    expect({ lat: 51.5, lng: -0.1, ...getTeamCoordinateUpdate() }).toEqual({ lat: 51.5, lng: -0.1 });
  });
  it('separates Japanese API season labels from the app membership window', () => {
    expect(getImportApiSeason(98, 2026, true)).toBe(2027);
    expect(getImportApiSeason(99, 2026, true)).toBe(2026);
    expect(getImportApiSeason(100, 2026, true)).toBe(2026);
    expect(getImportApiSeason(98, 2025, true)).toBe(2025);
    expect(getImportApiSeason(98, 2026, false)).toBe(2026);
  });

  it('excludes cups and unavailable or redundant FM27 league sources', () => {
    for (const id of [561, 1032, 270]) expect(includeImportLeague(id, 'DOMESTIC_LEAGUE', true)).toBe(false);
    expect(includeImportLeague(66, 'DOMESTIC_CUP', false)).toBe(false);
    expect(includeImportLeague(408, 'DOMESTIC_LEAGUE', true)).toBe(true);
    expect(includeImportLeague(561, 'DOMESTIC_LEAGUE', false)).toBe(true);
  });

  it('omits only conflicting new memberships and preserves historical imports', () => {
    expect(includeImportTeam(357, 3844, 2026, true)).toBe(false);
    expect(includeImportTeam(358, 3844, 2026, true)).toBe(true);
    expect(includeImportTeam(104, 7001, 2026, true)).toBe(false);
    expect(includeImportTeam(104, 16217, 2026, true)).toBe(false);
    expect(includeImportTeam(474, 7001, 2026, true)).toBe(true);
    expect(includeImportTeam(473, 16217, 2026, true)).toBe(true);
    expect(includeImportTeam(357, 3844, 2025, true)).toBe(true);
  });
});
