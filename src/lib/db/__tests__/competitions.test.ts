import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findCompetitions: vi.fn(),
  findCountries: vi.fn(),
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    competitionGroup: { findMany: mocks.findCompetitions },
    country: { findMany: mocks.findCountries },
  },
}));

import { getActiveCompetitions } from '../competitions';

describe('competition gender filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findCompetitions.mockResolvedValue([]);
    mocks.findCountries.mockResolvedValue([{ code: 'FR' }]);
  });

  it('restricts women teams to active women competitions in the requested country', async () => {
    await getActiveCompetitions({ countries: ['FR'], isFemale: true });
    expect(mocks.findCompetitions).toHaveBeenCalledWith({
      where: { isActive: true, countryCode: { in: ['FR'] }, isFemale: true },
    });
  });

  it('excludes women competitions for men and unknown teams', async () => {
    await getActiveCompetitions({ countries: ['FR'], isFemale: false });
    expect(mocks.findCompetitions).toHaveBeenCalledWith({
      where: {
        isActive: true,
        countryCode: { in: ['FR'] },
        OR: [{ isFemale: false }, { isFemale: null }],
      },
    });
  });

  it('allows both genders in save creation and restricts to eligible countries', async () => {
    await getActiveCompetitions({ type: 'DOMESTIC_LEAGUE' });
    expect(mocks.findCompetitions).toHaveBeenCalledWith({
      where: { isActive: true, countryCode: { in: ['FR'] }, type: 'DOMESTIC_LEAGUE' },
    });
  });

  it('preserves gender filtering for world cup and continental result selectors', async () => {
    await getActiveCompetitions({
      countries: ['WOR'],
      types: ['DOMESTIC_CUP', 'CONTINENTAL_CLUB'],
      isFemale: true,
    });
    expect(mocks.findCompetitions).toHaveBeenCalledWith({
      where: {
        isActive: true,
        countryCode: { in: ['WOR'] },
        type: { in: ['DOMESTIC_CUP', 'CONTINENTAL_CLUB'] },
        isFemale: true,
      },
    });
  });
});
