import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { FullCareerStint } from '../../../lib/types/prisma/Career';
import type { FullDetailsSaveWithOwnership } from '../../../lib/types/prisma/Save';
import CareerTimeline from './CareerTimeline';

const date = new Date('2026-11-01T00:00:00Z');
const save: FullDetailsSaveWithOwnership = {
  id: 'test-save', userId: 'test-user', gameId: 'fm27', countryCode: null,
  currentClubId: null, currentNTId: null, currentLeagueId: null,
  season: '2026/27', createdAt: date, updatedAt: date,
  currentClub: null, currentNT: null, currentLeague: null,
  game: {
    id: 'fm27', name: 'Football Manager 27', shortName: 'FM27',
    version: '27', platform: 'PC', logoUrl: '', releaseDate: date,
    createdAt: date, updatedAt: date, isActive: true, sortOrder: 1, variant: 'standard',
  },
  trophies: [], challenges: [], careerStints: [], seasons: [], isOwner: false,
};

function stint(id: number, startDate: string, name: string, isNational = false): FullCareerStint {
  return {
    id, saveId: save.id, teamId: id, startDate, endDate: null, isNational,
    createdAt: date, updatedAt: date,
    team: {
      id, name, logo: '', national: isNational, countryCode: 'ES',
      lat: null, lng: null, isFemale: false,
    },
  };
}

function renderTimeline(careerStints: FullCareerStint[]) {
  const html = renderToStaticMarkup(<CareerTimeline saveDetails={{ ...save, careerStints }} />);
  const numbers = Array.from(html.matchAll(/<span\b[^>]*>(\d+)<\/span>/g), (match) => Number(match[1]));
  const names = Array.from(html.matchAll(/<h4\b[^>]*>([^<]+)<\/h4>/g), (match) => match[1]);
  return { html, numbers, names };
}

describe('career timeline numbering', () => {
  it('keeps newest roles first while numbering from earliest to latest regardless of input order', () => {
    const { numbers, names } = renderTimeline([
      stint(2, '2025-07-01', 'Middle Club'),
      stint(1, '2024-07-01', 'First Club'),
      stint(3, '2026-07-01', 'Latest Club'),
    ]);
    expect(numbers).toEqual([3, 2, 1]);
    expect(names).toEqual(['Latest Club', 'Middle Club', 'First Club']);
  });

  it('shares a number for simultaneous club and national roles', () => {
    const { numbers, names } = renderTimeline([
      stint(1, '2024-07-01', 'First Club'),
      stint(2, '2026-07-01', 'Latest Club'),
      stint(3, '2026-07-01', 'National Team', true),
    ]);
    expect(numbers).toEqual([2, 1]);
    expect(names).toEqual(['Latest Club', 'National Team', 'First Club']);
  });

  it('numbers a single role as 1', () => {
    expect(renderTimeline([stint(1, '2026-07-01', 'Only Club')]).numbers).toEqual([1]);
  });

  it('renders no numbers for an empty history', () => {
    const { html, numbers } = renderTimeline([]);
    expect(numbers).toEqual([]);
    expect(html).not.toContain('Started ');
  });
});
