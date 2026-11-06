import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { CompetitionGroup, Country, Game, Team } from '../../../prisma/generated/client';
import type { CareerChallengeWithDetails, Challenge, ChallengeGoalWithDetails } from '../../lib/types/prisma/Challenge';
import type { SeasonSummary } from '../../lib/types/prisma/Season';
import TeamGrid from '../add-save/TeamGrid';
import NewSaveForm from '../add-save/NewSaveForm';
import MiniChallengeCard from '../challenges/MiniChallengeCard';
import ChallengeGoalCard from '../challenges/[id]/ChallengeGoalCard';
import { ChallengesPageSkeleton } from '../challenges/ChallengesPageSkeleton';
import { SaveDetailsSkeleton } from '../saves/[id]/SaveDetailsSkeleton';
import { SeasonCard } from '../saves/[id]/SeasonCard';
import TrophiesHeader from '../trophies/TrophiesHeader';
import TrophyCountry from '../trophies/TrophyCountry';
import { TrophiesPageSkeleton } from '../trophies/TrophiesPageSkeleton';
import LandingPage from '../page';
import GradientButton from './GradientButton';
import LoadingButton from './LoadingButton';

vi.mock('./AuthProvider', () => ({
  useAuth: () => ({ user: null, userLoading: false }),
}));
vi.mock('../../lib/analytics/events', () => ({
  AnalyticsEvents: { SaveCreated: 'save_created' },
  trackEvent: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const date = new Date('2026-11-01T00:00:00Z');
const game: Game = {
  id: 'fm27', name: 'Football Manager 27', shortName: 'FM27',
  version: '27', platform: 'PC', logoUrl: '', releaseDate: date,
  createdAt: date, updatedAt: date, isActive: true, sortOrder: 1, variant: 'standard',
};
const team: Team = {
  id: 1, name: 'A Club With A Very Long Name', logo: '/football.png',
  national: false, countryCode: 'ES', lat: null, lng: null, isFemale: true,
};
const country: Country = {
  code: 'ES', name: 'Spain', flag: '/football.png',
  inFootballManager: true, createdAt: date, updatedAt: date,
};
const competition: CompetitionGroup = {
  id: 1, name: 'A League With A Very Long Name', displayName: 'League',
  countryCode: 'ES', type: 'DOMESTIC_LEAGUE', tier: 1, isFemale: true,
  logoUrl: '/football.png', isActive: true, createdAt: date, updatedAt: date,
};
const goal: ChallengeGoalWithDetails = {
  id: 1, challengeDefinitionId: 1, challengeId: 1, position: 1,
  title: 'League title', description: 'Win the league', logic: 'ALL',
  metadata: null, createdAt: date, competitionId: 1, countryId: 'ES',
  competition, country, teams: [{ teamId: team.id, team }], rules: [],
};
const challenge: Challenge = {
  id: 1, key: 'league-title', title: 'League title', name: 'League title',
  description: 'Win a league title', summary: null, status: 'PUBLISHED',
  sortOrder: 1, tags: ['league'], metadata: null, publishedAt: date,
  archivedAt: null, createdAt: date, updatedAt: date, bonus: null, goals: [goal],
};
const run: CareerChallengeWithDetails = {
  id: 1, userId: 'preview-user', saveId: 'preview-save', gameId: game.id,
  challengeDefinitionId: challenge.id, challengeId: challenge.id, status: 'ACTIVE',
  startedAt: date, completedAt: null, progressSnapshot: null, metadata: null,
  challenge, game, goalProgress: [{
    id: 1, challengeRunId: 1, challengeGoalId: goal.id, isComplete: true,
    progress: 1, completedAt: date, evidence: null, createdAt: date, updatedAt: date,
  }],
};
const season: SeasonSummary = {
  id: 1, saveId: 'preview-save', season: '2026/27', teamId: team.id,
  createdAt: date, updatedAt: date, team, leagueResult: null, cupResults: [],
};

describe('companion UI rendering', () => {
  it('uses the shared pink-to-violet action style for modal loading buttons', () => {
    const html = renderToStaticMarkup(
      <LoadingButton type="submit" width="full" size="lg" className="mt-3">Save Career Stint</LoadingButton>
    );
    expect(html).toContain('fm-action');
    expect(html).not.toContain('from-[var(--color-primary)]');
    expect(html).toContain('type="submit"');
    expect(html).toContain('w-full');
    expect(html).toContain('text-lg');
    expect(html).toContain('mt-3');
    expect(html).toContain('Save Career Stint');
    expect(html).not.toContain('disabled=""');
  });

  it('keeps loading buttons disabled with their spinner and custom loading text', () => {
    const html = renderToStaticMarkup(
      <LoadingButton isLoading loadingText="Saving Season...">Save Season</LoadingButton>
    );
    expect(html).toContain('fm-action');
    expect(html).toContain('disabled=""');
    expect(html).toContain('animate-spin');
    expect(html).toContain('Saving Season...');
    expect(html).not.toContain('>Save Season<');
  });

  it('preserves explicit disabled and default loading states', () => {
    const disabled = renderToStaticMarkup(<LoadingButton disabled>Save Trophy</LoadingButton>);
    expect(disabled).toContain('disabled=""');
    expect(disabled).toContain('Save Trophy');
    expect(disabled).not.toContain('animate-spin');
    const loading = renderToStaticMarkup(<LoadingButton isLoading>Save Trophy</LoadingButton>);
    expect(loading).toContain('Loading...');
    expect(loading).toContain('disabled=""');
  });

  it('retains a 44px minimum touch height for small destructive actions', () => {
    const html = renderToStaticMarkup(<GradientButton size="sm" destructive>Remove</GradientButton>);
    expect(html).toContain('min-h-11');
    expect(html).toContain('from-[#b42318] to-[#d92d20] text-white');
    expect(html).not.toContain('fm-action');
  });

  it('keeps the save wizard initial setup, selected start mode and disabled navigation', () => {
    const html = renderToStaticMarkup(<NewSaveForm />);
    expect(html).toContain('Create New Save');
    expect(html).toContain('aria-current="step"');
    expect(html).toContain('aria-pressed="true" class="fm-choice">Choose Team');
    expect(html).toContain('aria-pressed="false" class="fm-choice">Unemployed');
    expect(html).toMatch(/<button\b(?=[^>]*disabled="")(?=[^>]*class="fm-action w-full sm:w-auto")[^>]*>Continue/);
    expect(html).toContain('class="fm-field"');
    expect(html).not.toContain('Create Unemployed Save');
  });

  it('preserves selected team state and long team labels', () => {
    const html = renderToStaticMarkup(
      <TeamGrid teams={[team, { ...team, id: 2, name: 'Another Club' }]} selectedTeamId="1" onSelect={() => {}} />
    );
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain(team.name);
    expect(html).toContain('break-words');
    expect(html).toContain('focus-visible:outline-2');
  });

  it('keeps challenge navigation, statuses and progress', () => {
    const notStarted = renderToStaticMarkup(<MiniChallengeCard userChallenge={challenge} />);
    expect(notStarted).toContain('href="/challenges/league-title"');
    expect(notStarted).toContain('Not Started');
    expect(notStarted).toContain('Start challenge');
    expect(notStarted).not.toContain('aspect-square');
    const active = renderToStaticMarkup(<MiniChallengeCard userChallenge={run} />);
    expect(active).toContain('In Progress');
    expect(active).toContain('100%');
    const completed = renderToStaticMarkup(<MiniChallengeCard userChallenge={{ ...run, completedAt: date }} />);
    expect(completed).toContain('Completed');
    expect(completed).toContain('color-success');
  });

  it('handles an active challenge with no goals without invalid progress', () => {
    const html = renderToStaticMarkup(
      <MiniChallengeCard userChallenge={{ ...run, challenge: { ...challenge, goals: [] }, goalProgress: [] }} />
    );
    expect(html).toContain('0%');
    expect(html).not.toContain('NaN');
  });

  it('retains country, competition and team context in goal cards', () => {
    const html = renderToStaticMarkup(<ChallengeGoalCard goal={goal} selectedUserChallenge={null} />);
    expect(html).toContain(goal.description);
    expect(html).toContain(country.name);
    expect(html).toContain(competition.displayName);
    expect(html).toContain(team.name);
    expect(html).toContain('fm-inset');
  });

  it('keeps game and gender filters labelled and selected with correct totals', () => {
    const html = renderToStaticMarkup(
      <TrophiesHeader games={[game]} selectedGame="fm27" onGameChange={() => {}}
        selectedGender="women" onGenderChange={() => {}} totalTrophies={3} totalCompetitions={4} />
    );
    expect(html).toContain('for="game-select"');
    expect(html).toContain('for="gender-select"');
    expect(html).toContain('value="fm27" selected=""');
    expect(html).toContain('value="women" selected=""');
    expect(html).toContain('75%');
    expect(html.match(/class="fm-field"/g)).toHaveLength(2);
  });

  it('renders zero trophy completion and an accessible collapsed country control', () => {
    const header = renderToStaticMarkup(
      <TrophiesHeader games={[game]} selectedGame="all" onGameChange={() => {}}
        selectedGender="all" onGenderChange={() => {}} />
    );
    expect(header).toContain('0%');
    expect(header).not.toContain('NaN');
    const html = renderToStaticMarkup(
      <TrophyCountry country={{ ...country, competitions: [competition] }} trophies={[]} />
    );
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-controls="trophy-country-ES"');
    expect(html).toContain('0 of 1 competitions');
    expect(html).toContain('focus-visible:outline-2');
  });

  it('only shows season edit and delete actions when supplied by the owner', () => {
    const readOnly = renderToStaticMarkup(<SeasonCard season={season} />);
    expect(readOnly).toContain(season.season);
    expect(readOnly).toContain(team.name);
    expect(readOnly).not.toContain('Edit season');
    expect(readOnly).not.toContain('Delete season');
    const editable = renderToStaticMarkup(
      <SeasonCard season={season} onEdit={() => {}} onDelete={() => {}} />
    );
    expect(editable).toContain('aria-label="Edit season"');
    expect(editable).toContain('aria-label="Delete season"');
    expect(editable).toContain('h-11 w-11');
  });

  it('keeps skeletons aligned with flat panels and announces loading', () => {
    for (const element of [<ChallengesPageSkeleton key="challenges" />, <SaveDetailsSkeleton key="save" />, <TrophiesPageSkeleton key="trophies" />]) {
      const html = renderToStaticMarkup(element);
      expect(html).toContain('aria-busy="true"');
      expect(html).toContain('fm-panel');
      expect(html).not.toContain('backdrop-blur');
      expect(html).not.toContain('rounded-3xl');
    }
  });

  it('keeps landing actions as links and preserves feature availability', () => {
    const html = renderToStaticMarkup(<LandingPage />);
    expect(html).toMatch(/<a\b(?=[^>]*href="\/saves")(?=[^>]*class="fm-action")[^>]*>/);
    expect(html).toMatch(/<a\b(?=[^>]*href="#features")(?=[^>]*class="fm-secondary")[^>]*>/);
    expect(html).not.toContain('<button');
    expect(html.match(/Coming Soon/g)).toHaveLength(2);
    expect(html).not.toContain('glass-panel');
  });
});
