import { describe, expect, it } from 'vitest';
import { competitionPath, nextSeason, seasonBody, stintBody, trophyBody } from './saveEntries';
import type { CareerTeam, SaveCompetition } from './types';

const team: CareerTeam = { id: 10, name: 'Club', logo: null, countryCode: 'ES', national: false, isFemale: true };
const league: SaveCompetition = { id: 20, name: 'League', logoUrl: null, countryCode: 'ES', tier: 1, isFemale: true };
const cup: SaveCompetition = { ...league, id: 30, name: 'Continental cup', countryCode: 'WOR', tier: null };
const seasonInput = { season: '2026/27', team, league: null, position: '', promoted: false, relegated: false, cups: [] };

describe('mobile save entry contracts', () => {
  it('builds club and national stints with optional end dates', () => {
    expect(stintBody(team, league, '2026-07-01', '')).toEqual({
      teamId: '10', leagueId: '20', startDate: '2026-07-01', endDate: null, isNational: false,
    });
    expect(stintBody({ ...team, national: true }, league, '2026-07-01', '2027-01-01')).toEqual({
      teamId: '10', leagueId: '', startDate: '2026-07-01', endDate: '2027-01-01', isNational: true,
    });
  });

  it('rejects invalid calendar dates and backwards stint dates', () => {
    expect(() => stintBody(team, null, '2026-02-29', '')).toThrow('valid date');
    expect(() => stintBody(team, null, '2028-02-29', '')).not.toThrow();
    expect(() => stintBody(team, null, '2026-07-01', '2026-06-30')).toThrow('before start date');
    expect(() => trophyBody(team, cup, 'not-a-date')).toThrow('valid date');
  });

  it('supports cup-only seasons and sends the competition country, not the team country', () => {
    expect(seasonBody({ ...seasonInput, cups: [{ competition: cup, reachedRound: 'Winners' }] })).toEqual({
      season: '2026/27', teamId: '10',
      cupResults: [{ competitionId: '30', countryCode: 'WOR', reachedRound: 'Winners' }],
    });
    expect(trophyBody(team, cup, '2027-05-20')).toEqual({
      teamId: '10', competitionId: '30', countryCode: 'WOR', dateWon: '2027-05-20',
    });
  });

  it('requires paired league inputs and valid positions, and prevents top-flight promotion', () => {
    expect(() => seasonBody({ ...seasonInput, league })).toThrow('provided together');
    expect(() => seasonBody({ ...seasonInput, position: '1' })).toThrow('provided together');
    for (const position of ['0', '-1', '1.5', 'abc']) {
      expect(() => seasonBody({ ...seasonInput, league, position })).toThrow('positive whole number');
    }
    expect(seasonBody({ ...seasonInput, league, position: '1', promoted: true })).toMatchObject({
      leagueId: '20', leaguePosition: 1, promoted: false, relegated: false,
    });
    expect(seasonBody({ ...seasonInput, league: { ...league, tier: 2 }, position: '2', promoted: true }).promoted).toBe(true);
  });

  it('validates seasons and incomplete cup rows before submission', () => {
    expect(() => seasonBody({ ...seasonInput, season: '2026/28' })).toThrow('consecutive years');
    expect(() => seasonBody({ ...seasonInput, cups: [{ competition: null, reachedRound: 'Final' }] })).toThrow('every cup result');
    expect(() => seasonBody({ ...seasonInput, cups: [{ competition: cup, reachedRound: 'Invalid' }] })).toThrow('valid cup round');
  });

  it('suggests the next chronological season regardless of API ordering or century rollover', () => {
    expect(nextSeason({ season: '2026/27', seasons: [] })).toBe('2026/27');
    const seasons = ['2098/99', '2097/98', '2099/00'].map(season => ({
      id: 1, season, team, leagueResult: null, cupResults: [],
    }));
    expect(nextSeason({ season: '2099/00', seasons })).toBe('2100/01');
  });

  it('filters competitions by team gender and includes world competitions only when requested', () => {
    const women = new URL(competitionPath(team, 'DOMESTIC_CUP,CONTINENTAL_CLUB', true), 'https://fm.example');
    expect(women.searchParams.getAll('country')).toEqual(['ES', 'WOR']);
    expect(women.searchParams.get('isFemale')).toBe('true');
    expect(women.searchParams.get('type')).toBe('DOMESTIC_CUP,CONTINENTAL_CLUB');
    const men = new URL(competitionPath({ ...team, isFemale: null }, 'DOMESTIC_LEAGUE'), 'https://fm.example');
    expect(men.searchParams.getAll('country')).toEqual(['ES']);
    expect(men.searchParams.get('isFemale')).toBe('false');
  });
});
