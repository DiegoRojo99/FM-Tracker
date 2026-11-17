import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SaveEntryScreen } from './SaveEntryScreen';
import { SaveDetailsScreen } from './SaveDetailsScreen';
import type { CareerTeam, SaveCompetition, SaveDetails } from '../lib/types';

type Loader = (api: typeof mocks.api) => Promise<unknown>;
type Resource = { load: Loader | null; data: unknown; loading: boolean; error: string | null; refresh: () => void };
type SelectProps = { label: string; value: string; disabled?: boolean; options: { value: string; label: string }[]; onChange: (value: string) => void };
type InputProps = { accessibilityLabel: string; value: string; editable?: boolean; onChangeText: (value: string) => void };
type ButtonProps = { title: string; disabled?: boolean; onPress: () => void };
type ToggleProps = { accessibilityLabel: string; value: boolean; disabled?: boolean; onValueChange: (value: boolean) => void };
const mocks = vi.hoisted(() => ({
  values: [] as unknown[],
  refs: [] as { current: unknown }[],
  callbacks: [] as { deps: unknown[]; callback: unknown }[],
  resources: [] as Resource[],
  stateIndex: 0, refIndex: 0, callbackIndex: 0, resourceIndex: 0,
  buttons: new Map<string, ButtonProps>(),
  selects: new Map<string, SelectProps>(),
  inputs: new Map<string, InputProps>(),
  toggles: new Map<string, ToggleProps>(),
  api: vi.fn<(path: string, options?: RequestInit) => Promise<unknown>>(),
  goBack: vi.fn(),
  navigate: vi.fn(),
  owner: true,
  hasHistory: true,
}));

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useState: (initial: unknown) => {
      const index = mocks.stateIndex++;
      if (!(index in mocks.values)) mocks.values[index] = typeof initial === 'function' ? initial() : initial;
      return [mocks.values[index], (value: unknown) => {
        mocks.values[index] = typeof value === 'function' ? value(mocks.values[index]) : value;
      }];
    },
    useRef: (initial: unknown) => mocks.refs[mocks.refIndex++] ??= { current: initial },
    useCallback: (callback: unknown, deps: unknown[]) => {
      const index = mocks.callbackIndex++;
      const previous = mocks.callbacks[index];
      if (!previous || deps.some((dep, i) => dep !== previous.deps[i])) mocks.callbacks[index] = { callback, deps };
      return mocks.callbacks[index].callback;
    },
  };
});
vi.mock('react-native', () => ({
  View: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Text: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  TextInput: (props: InputProps) => { mocks.inputs.set(props.accessibilityLabel, props); return null; },
  Switch: (props: ToggleProps) => { mocks.toggles.set(props.accessibilityLabel, props); return null; },
}));
vi.mock('../auth/AuthProvider', () => ({ useApi: () => mocks.api }));
vi.mock('../components/SelectField', () => ({
  SelectField: (props: SelectProps) => { mocks.selects.set(props.label, props); return null; },
}));
vi.mock('../components/ui', () => ({
  Button: (props: ButtonProps) => { mocks.buttons.set(props.title, props); return <button>{props.title}</button>; },
  Screen: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  ResourceState: ({ error }: { error: string | null }) => error ? <span>{error}</span> : null,
  Crest: () => null, Empty: () => null, Icon: () => null, Progress: () => null, Stats: () => null,
}));
vi.mock('../theme', () => ({ colors: {}, styles: {} }));
vi.mock('../hooks/useResource', () => ({
  useResource: (load: Loader) => {
    const index = mocks.resourceIndex++;
    const previous = mocks.resources[index];
    if (previous?.load !== load) {
      const resource: Resource = {
        load, data: previous?.data ?? null, loading: true, error: null,
        refresh: () => { resource.load = null; },
      };
      mocks.resources[index] = resource;
      void load(mocks.api).then(data => {
        if (mocks.resources[index] === resource) resource.data = data;
      }).catch((error: Error) => {
        if (mocks.resources[index] === resource) resource.error = error.message;
      }).finally(() => { resource.loading = false; });
    }
    return mocks.resources[index];
  },
}));

const club: CareerTeam = { id: 10, name: 'Club', logo: null, countryCode: 'ES', national: false, isFemale: false };
const women: CareerTeam = { ...club, id: 11, isFemale: true };
const national: CareerTeam = { ...club, id: 12, name: 'Spain', national: true };
const league: SaveCompetition = { id: 20, name: 'League', logoUrl: null, countryCode: 'ES', tier: 1, isFemale: false };
const cup: SaveCompetition = { ...league, id: 30, name: 'Cup', countryCode: 'WOR', tier: null };
const save: SaveDetails = {
  id: 'save-1', season: '2026/27', updatedAt: '', currentClub: club, currentNT: null, currentLeague: league,
  game: { id: 'fm27', name: 'Football Manager 2027', shortName: 'FM27' },
  isOwner: true, seasons: [], trophies: [], challenges: [],
  careerStints: [club, women, national].map(team => ({ id: team.id, team, startDate: '2026-07-01', endDate: null, isNational: team.national })),
};
let kind: 'stint' | 'season' | 'trophy' | 'details';

function render() {
  mocks.stateIndex = mocks.refIndex = mocks.callbackIndex = mocks.resourceIndex = 0;
  mocks.buttons.clear(); mocks.selects.clear(); mocks.inputs.clear(); mocks.toggles.clear();
  if (kind === 'details') {
    const navigation: Pick<Parameters<typeof SaveDetailsScreen>[0]['navigation'], 'navigate'> = { navigate: mocks.navigate };
    const props = { navigation, route: { key: 'details', name: 'SaveDetails' as const, params: { id: save.id } } };
    return renderToStaticMarkup(<SaveDetailsScreen {...props as Parameters<typeof SaveDetailsScreen>[0]} />);
  }
  const navigation: Pick<Parameters<typeof SaveEntryScreen>[0]['navigation'], 'goBack'> = { goBack: mocks.goBack };
  const props = { navigation, route: { key: 'entry', name: 'AddSaveEntry' as const, params: { id: save.id, kind } } };
  return renderToStaticMarkup(<SaveEntryScreen {...props as Parameters<typeof SaveEntryScreen>[0]} />);
}

async function settle() {
  render();
  await vi.waitFor(() => {
    render();
    expect(mocks.resources.every(resource => !resource.loading)).toBe(true);
  });
}
function press(title: string) {
  render();
  const button = mocks.buttons.get(title);
  expect(button, title).toBeDefined();
  expect(button!.disabled, title).not.toBe(true);
  button!.onPress();
}
function input(label: string, value: string) {
  render();
  const field = mocks.inputs.get(label);
  expect(field, label).toBeDefined();
  field!.onChangeText(value);
}
function select(label: string, value: string) {
  render();
  const field = mocks.selects.get(label);
  expect(field, label).toBeDefined();
  expect(field!.disabled, label).not.toBe(true);
  field!.onChange(value);
}
function posts() {
  return mocks.api.mock.calls.filter(([, options]) => options?.method === 'POST');
}

beforeEach(() => {
  mocks.values = []; mocks.refs = []; mocks.callbacks = []; mocks.resources = [];
  mocks.owner = true;
  mocks.hasHistory = true;
  kind = 'season';
  vi.resetAllMocks();
  mocks.api.mockImplementation(async (path, options) => {
    if (options?.method === 'POST') return { id: 100 };
    if (path === '/api/saves/save-1') return { ...save, isOwner: mocks.owner, careerStints: mocks.hasHistory ? save.careerStints : [] };
    if (path.startsWith('/api/teams?')) return [club, women, national];
    if (path.startsWith('/api/competitions?')) {
      const params = new URL(path, 'https://fm.example').searchParams;
      const items = params.get('type') === 'DOMESTIC_LEAGUE' ? [league] : [cup];
      return items.map(item => ({ ...item, isFemale: params.get('isFemale') === 'true' }));
    }
    throw new Error(`Unexpected request: ${path}`);
  });
});

describe('mobile save entry flows', () => {
  it('exposes all three owner actions and navigates to the matching form', async () => {
    kind = 'details';
    await settle();
    for (const entry of ['stint', 'season', 'trophy'] as const) {
      press(`Add ${entry}`);
      expect(mocks.navigate).toHaveBeenLastCalledWith('AddSaveEntry', { id: save.id, kind: entry });
    }
  });

  it('hides add actions for visitors and blocks a directly opened form', async () => {
    mocks.owner = false;
    kind = 'details';
    await settle();
    expect([...mocks.buttons.keys()].some(title => title.startsWith('Add '))).toBe(false);
    kind = 'trophy';
    expect(render()).toContain('You can only modify your own saves.');
    expect(mocks.buttons.has('Save trophy')).toBe(false);
    expect(posts()).toHaveLength(0);
  });

  it('searches and adds a female club stint with gender-filtered leagues', async () => {
    kind = 'stint';
    await settle();
    input('Team search', 'Club');
    press('Search teams');
    await settle();
    select('Team', String(women.id));
    await settle();
    select('League (optional)', String(league.id));
    input('Start date', '2027-01-01');
    input('End date (optional)', '2027-06-30');
    press('Save stint');
    await vi.waitFor(() => expect(mocks.goBack).toHaveBeenCalledOnce());
    expect(posts()[0][0]).toBe('/api/saves/save-1/career');
    expect(JSON.parse(String(posts()[0][1]?.body))).toEqual({
      teamId: '11', leagueId: '20', startDate: '2027-01-01', endDate: '2027-06-30', isNational: false,
    });
    expect(mocks.api.mock.calls.some(([path]) => path.includes('isFemale=true') && path.includes('DOMESTIC_LEAGUE'))).toBe(true);
  });

  it('adds national-team appointments without requiring a domestic league', async () => {
    kind = 'stint';
    await settle();
    input('Team search', 'Spain');
    press('Search teams');
    await settle();
    select('Team', String(national.id));
    await settle();
    expect(mocks.selects.has('League (optional)')).toBe(false);
    input('Start date', '2027-01-01');
    press('Save stint');
    await vi.waitFor(() => expect(mocks.goBack).toHaveBeenCalledOnce());
    expect(JSON.parse(String(posts()[0][1]?.body))).toEqual({
      teamId: '12', leagueId: '', startDate: '2027-01-01', endDate: null, isNational: true,
    });
  });

  it.each(['season', 'trophy'] as const)('requires a career stint before adding a %s', async entry => {
    kind = entry;
    mocks.hasHistory = false;
    await settle();
    expect(render()).toContain('Add a career stint first.');
    expect(mocks.buttons.get(`Save ${entry}`)?.disabled).toBe(true);
    expect(posts()).toHaveLength(0);
  });

  it('adds cup-only seasons and resets all dependent fields when changing team', async () => {
    await settle();
    select('Team', String(club.id));
    await settle();
    select('League (optional)', String(league.id));
    input('League position', '1');
    press('Add cup result');
    select('Cup 1', String(cup.id));
    select('Team', String(women.id));
    render();
    expect(mocks.selects.get('League (optional)')?.value).toBe('');
    expect(mocks.selects.has('Cup 1')).toBe(false);
    expect(mocks.inputs.has('League position')).toBe(false);
    await settle();
    press('Add cup result');
    select('Cup 1', String(cup.id));
    select('Round reached 1', 'Winners');
    press('Save season');
    await vi.waitFor(() => expect(mocks.goBack).toHaveBeenCalledOnce());
    expect(posts()[0][0]).toBe('/api/saves/save-1/seasons');
    expect(JSON.parse(String(posts()[0][1]?.body))).toEqual({
      season: '2026/27', teamId: '11', cupResults: [{ competitionId: '30', countryCode: 'WOR', reachedRound: 'Winners' }],
    });
  });

  it('keeps trophy input after an API error and prevents double-tap submissions', async () => {
    kind = 'trophy';
    await settle();
    select('Team', String(club.id));
    await settle();
    select('Competition', String(cup.id));
    input('Date won', '2027-05-20');
    let rejectPost!: (error: Error) => void;
    mocks.api.mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectPost = reject; }));
    render();
    const action = mocks.buttons.get('Save trophy')!.onPress;
    action(); action();
    expect(posts()).toHaveLength(1);
    rejectPost(new Error('Server unavailable'));
    await vi.waitFor(() => expect(render()).toContain('Server unavailable'));
    expect(mocks.goBack).not.toHaveBeenCalled();
    expect(mocks.inputs.get('Date won')?.value).toBe('2027-05-20');
    expect(mocks.selects.get('Competition')?.value).toBe('30');
    press('Save trophy');
    await vi.waitFor(() => expect(mocks.goBack).toHaveBeenCalledOnce());
    expect(posts()[1][0]).toBe('/api/saves/save-1/trophies');
    expect(JSON.parse(String(posts()[1][1]?.body))).toEqual({
      teamId: '10', competitionId: '30', countryCode: 'WOR', dateWon: '2027-05-20',
    });
  });

  it('validates league positions and disables promotion for a top-flight season', async () => {
    await settle();
    select('Team', String(club.id));
    await settle();
    select('League (optional)', String(league.id));
    input('League position', '0');
    press('Save season');
    expect(render()).toContain('League position must be a positive whole number.');
    expect(posts()).toHaveLength(0);
    expect(mocks.toggles.get('Promoted (not available in top flight)')?.disabled).toBe(true);
    input('League position', '1');
    press('Save season');
    await vi.waitFor(() => expect(mocks.goBack).toHaveBeenCalledOnce());
    expect(JSON.parse(String(posts()[0][1]?.body))).toEqual({
      season: '2026/27', teamId: '10', leagueId: '20', leaguePosition: 1,
      promoted: false, relegated: false, cupResults: [],
    });
  });
});
