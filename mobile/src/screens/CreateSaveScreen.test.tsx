import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateSaveScreen } from './CreateSaveScreen';

type Loader = (api: typeof mocks.api) => Promise<unknown>;
type Resource = { load: Loader | null; data: unknown; loading: boolean; error: string | null; refresh: () => void };
const mocks = vi.hoisted(() => ({
  values: [] as unknown[],
  refs: [] as { current: unknown }[],
  callbacks: [] as { deps: unknown[]; callback: unknown }[],
  resources: [] as Resource[],
  stateIndex: 0,
  refIndex: 0,
  callbackIndex: 0,
  resourceIndex: 0,
  api: vi.fn<(path: string, options?: RequestInit) => Promise<unknown>>(),
  replace: vi.fn(),
}));

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useState: (initial: unknown) => {
      const index = mocks.stateIndex++;
      if (!(index in mocks.values)) mocks.values[index] = initial;
      return [mocks.values[index], (value: unknown) => { mocks.values[index] = value; }];
    },
    useRef: (initial: unknown) => {
      const index = mocks.refIndex++;
      return mocks.refs[index] ??= { current: initial };
    },
    useCallback: (callback: unknown, deps: unknown[]) => {
      const index = mocks.callbackIndex++;
      const previous = mocks.callbacks[index];
      if (!previous || deps.some((dep, i) => dep !== previous.deps[i])) {
        mocks.callbacks[index] = { callback, deps };
      }
      return mocks.callbacks[index].callback;
    },
  };
});
vi.mock('react-native', () => ({ Text: 'Text', View: 'View' }));
vi.mock('../auth/AuthProvider', () => ({ useApi: () => mocks.api }));
vi.mock('../components/SelectField', () => ({ SelectField: 'SelectField' }));
vi.mock('../components/ui', () => ({ Button: 'Button', ResourceState: 'ResourceState', Screen: 'Screen' }));
vi.mock('../theme', () => ({ styles: {} }));
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

type Props = { children?: ReactNode; [key: string]: unknown };
function find(node: ReactNode, predicate: (element: ReactElement<Props>) => boolean): ReactElement<Props> | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = find(child, predicate);
      if (match) return match;
    }
    return undefined;
  }
  if (!isValidElement<Props>(node)) return undefined;
  return predicate(node) ? node : find(node.props.children, predicate);
}

function render() {
  mocks.stateIndex = mocks.refIndex = mocks.callbackIndex = mocks.resourceIndex = 0;
  const navigation: Pick<Parameters<typeof CreateSaveScreen>[0]['navigation'], 'replace'> = { replace: mocks.replace };
  return CreateSaveScreen({
    navigation,
    route: { key: 'create-save', name: 'CreateSave' },
  } as Parameters<typeof CreateSaveScreen>[0]);
}

function button(title: string) {
  const result = find(render(), element => element.props.title === title);
  expect(result, title).toBeDefined();
  return result!;
}

function press(title: string) {
  const target = button(title);
  expect(target.props.disabled, title).not.toBe(true);
  (target.props.onPress as () => void)();
}

function select(label: string, value: string) {
  const target = find(render(), element => element.props.label === label);
  expect(target, label).toBeDefined();
  expect(target!.props.disabled, label).not.toBe(true);
  (target!.props.onChange as (value: string) => void)(value);
}

async function settle() {
  render();
  await vi.waitFor(() => {
    render();
    expect(mocks.resources.every(resource => !resource.loading)).toBe(true);
  });
}

function postedOptions() {
  return mocks.api.mock.calls.filter(([, options]) => options?.method === 'POST').map(([, options]) => options!);
}

async function clubSetup() {
  await settle();
  press('Continue');
  select('Country', 'ES');
  await settle();
  select('League', '20');
  await settle();
  select('Team', '100');
  press('Continue');
}

beforeEach(() => {
  mocks.values = [];
  mocks.refs = [];
  mocks.callbacks = [];
  mocks.resources = [];
  vi.resetAllMocks();
  mocks.api.mockImplementation(async (path, options) => {
    if (options?.method === 'POST') return { id: 'created-save' };
    if (path === '/api/games?active=true') return { games: [
      { id: 'fm26', name: 'Football Manager 2026', releaseDate: '2025-11-01' },
      { id: 'fm27', name: 'Football Manager 2027', releaseDate: '2026-11-01' },
    ] };
    if (path === '/api/countries?fmOnly=true') return [{ code: 'ES', name: 'Spain' }, { code: 'GB', name: 'England' }];
    if (path.startsWith('/api/competitions?')) return [
      { id: 20, name: 'Liga F', isFemale: true, tier: 1 },
      { id: 10, name: 'La Liga', isFemale: false, tier: 1 },
    ];
    if (path.startsWith('/api/teams?')) return [{ id: 100, name: 'Barcelona', logo: '/barcelona.png' }];
    throw new Error(`Unexpected request: ${path}`);
  });
});

describe('mobile save creation', () => {
  it('creates an FM27 unemployed save and opens its details without fetching teams', async () => {
    await settle();
    press('Unemployed');
    press('Continue');
    press('Continue');
    press('Create unemployed save');
    await vi.waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('SaveDetails', { id: 'created-save' }));
    expect(JSON.parse(String(postedOptions()[0].body))).toEqual({
      gameId: 'fm27', countryCode: null, leagueId: null, startingTeamId: null,
      requestId: expect.any(String),
    });
    expect(mocks.api.mock.calls.some(([path]) => /competitions|teams/.test(path))).toBe(false);
  });

  it('uses the game-filtered league and team endpoints, reviews and creates a club save', async () => {
    await clubSetup();
    expect(mocks.api).toHaveBeenCalledWith('/api/competitions?country=ES&type=DOMESTIC_LEAGUE&gameId=fm27');
    expect(mocks.api).toHaveBeenCalledWith('/api/teams?leagueId=20&gameId=fm27');
    expect(JSON.stringify(render())).toContain('Liga F (Women)');
    expect(JSON.stringify(render())).toContain('Barcelona');
    press('Create save');
    await vi.waitFor(() => expect(mocks.replace).toHaveBeenCalled());
    const options = postedOptions()[0];
    expect(JSON.parse(String(options.body))).toEqual({
      gameId: 'fm27', countryCode: 'ES', leagueId: 20, startingTeamId: 100,
      requestId: options.headers && new Headers(options.headers).get('X-Idempotency-Key'),
    });
  });

  it('clears dependent choices when country or game changes and supports older games', async () => {
    await clubSetup();
    press('Back');
    select('Country', 'GB');
    expect(button('Continue').props.disabled).toBe(true);
    expect(find(render(), element => element.props.label === 'League')?.props.options).toEqual([]);
    await settle();
    const teamField = find(render(), element => element.props.label === 'Team');
    expect(teamField?.props.value).toBe('');
    expect(teamField?.props.disabled).toBe(true);
    press('Back');
    select('Game version', 'fm26');
    press('Unemployed');
    await settle();
    press('Continue');
    press('Continue');
    press('Create unemployed save');
    expect(JSON.parse(String(postedOptions()[0].body)).gameId).toBe('fm26');
  });

  it('prevents duplicate submissions and keeps the idempotency key on retry', async () => {
    await clubSetup();
    let rejectRequest!: (error: Error) => void;
    mocks.api.mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectRequest = reject; }));
    const onPress = button('Create save').props.onPress as () => void;
    onPress();
    onPress();
    expect(postedOptions()).toHaveLength(1);
    expect(button('Creating save...').props.disabled).toBe(true);
    rejectRequest(new Error('Connection interrupted'));
    await vi.waitFor(() => expect(find(render(), element => element.props.accessibilityRole === 'alert')?.props.children).toBe('Connection interrupted'));
    expect(mocks.replace).not.toHaveBeenCalled();
    press('Create save');
    await vi.waitFor(() => expect(mocks.replace).toHaveBeenCalled());
    expect(postedOptions()).toHaveLength(2);
    expect(postedOptions()[1].body).toBe(postedOptions()[0].body);
    expect(postedOptions()[1].headers).toEqual(postedOptions()[0].headers);
  });

  it('surfaces league loading errors and allows retry without changing the country', async () => {
    await settle();
    press('Continue');
    mocks.api.mockRejectedValueOnce(new Error('Leagues unavailable'));
    select('Country', 'ES');
    await settle();
    expect(button('Continue').props.disabled).toBe(true);
    const errorState = find(render(), element => element.props.error === 'Leagues unavailable');
    expect(errorState).toBeDefined();
    (errorState!.props.retry as () => void)();
    await settle();
    select('League', '20');
    await settle();
    select('Team', '100');
    expect(button('Continue').props.disabled).toBe(false);
  });

  it('uses a new idempotency key if the starting setup changes after a failed attempt', async () => {
    await clubSetup();
    mocks.api.mockRejectedValueOnce(new Error('Server unavailable'));
    press('Create save');
    await vi.waitFor(() => expect(button('Create save').props.disabled).toBe(false));
    press('Back');
    press('Back');
    press('Unemployed');
    await settle();
    press('Continue');
    press('Continue');
    press('Create unemployed save');
    expect(postedOptions()).toHaveLength(2);
    const first = JSON.parse(String(postedOptions()[0].body));
    const second = JSON.parse(String(postedOptions()[1].body));
    expect(first.requestId).not.toBe(second.requestId);
    expect(second.startingTeamId).toBeNull();
  });
});
