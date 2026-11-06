import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { PreviewSave } from '../../lib/types/prisma/Save';
import { SaveCard } from './SaveCard';
import { SaveCardSkeleton } from './SaveCardSkeleton';
import GradientButton from '../components/GradientButton';

const date = new Date('2026-11-01T00:00:00Z');
const save: PreviewSave = {
  id: 'preview-save',
  userId: 'preview-user',
  gameId: 'fm27',
  countryCode: null,
  currentClubId: null,
  currentNTId: null,
  currentLeagueId: null,
  season: '2026/27',
  createdAt: date,
  updatedAt: date,
  currentClub: null,
  currentNT: null,
  currentLeague: null,
  game: {
    id: 'fm27',
    name: 'Football Manager 27',
    shortName: 'FM27',
    version: '27',
    platform: 'PC',
    logoUrl: '',
    releaseDate: date,
    createdAt: date,
    updatedAt: date,
    isActive: true,
    sortOrder: 1,
    variant: 'standard',
  },
};

function renderCard(overrides: Partial<PreviewSave> = {}, isPendingDelete = false) {
  return renderToStaticMarkup(createElement(SaveCard, {
    save: { ...save, ...overrides },
    handleDelete: () => {},
    isPendingDelete,
  }));
}

describe('companion save cards', () => {
  it('keeps the save link separate from deletion and renders unemployed saves', () => {
    const html = renderCard();
    expect(html).toContain('href="/saves/preview-save"');
    expect(html).toContain('FM27');
    expect(html).toContain('2026/27');
    expect(html).toContain('No Team');
    expect(html).toContain('Free-Agent.png');
    expect(html).toContain('No current league');
    expect(html).toContain('aria-label="Delete save No Team"');
    expect(html.indexOf('</a>')).toBeLessThan(html.indexOf('<button'));
  });

  it('renders national team careers and prefers the club when both are present', () => {
    const team = {
      id: 1, name: 'National Team', logo: '/football.png', national: true,
      countryCode: 'ES', lat: null, lng: null, isFemale: false,
    };
    expect(renderCard({ currentNT: team })).toContain('Delete save National Team');
    const html = renderCard({
      currentNT: team,
      currentClub: { ...team, id: 2, name: 'A Club With A Very Long Name', national: false },
      currentLeague: {
        id: 1, name: 'League With A Very Long Name', displayName: 'League',
        countryCode: 'ES', type: 'LEAGUE', tier: 1, isFemale: false,
        logoUrl: '/football.png', isActive: true, createdAt: date, updatedAt: date,
      },
    });
    expect(html).toContain('Delete save A Club With A Very Long Name');
    expect(html).toContain('League With A Very Long Name');
    expect(html).toContain('break-words');
    expect(html).toContain('truncate');
    expect(html).toContain('focus-visible:outline-2');
  });

  it('announces a pending deletion without offering navigation or another delete', () => {
    const html = renderCard({}, true);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('role="status"');
    expect(html).toContain('Removing save');
    expect(html).not.toMatch(/<a(?:\s|>)/);
    expect(html).not.toContain('<button');
  });

  it('uses compact skeletons without exposing placeholder content to assistive technology', () => {
    const html = renderToStaticMarkup(createElement(SaveCardSkeleton));
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('h-12 w-12');
    expect(html).not.toContain('min-h-[150px]');
  });

  it('preserves action button disabled and destructive variants', () => {
    const normal = renderToStaticMarkup(
      <GradientButton disabled type="submit">Create New Save</GradientButton>
    );
    expect(normal).toContain('disabled=""');
    expect(normal).toContain('type="submit"');
    expect(normal).toContain('bg-linear-to-r/srgb from-[var(--color-highlight)] to-[var(--color-highlight-violet)] text-black');
    const destructive = renderToStaticMarkup(
      <GradientButton destructive>Delete</GradientButton>
    );
    expect(destructive).toContain('from-[#b42318] to-[#d92d20] text-white');
  });
});
