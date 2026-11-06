import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  apps: [] as object[],
  initializeApp: vi.fn(),
  cert: vi.fn(),
  auth: { setCustomUserClaims: vi.fn() },
  firestore: {},
}));

vi.mock('firebase-admin', () => ({
  default: {
    apps: mocks.apps,
    initializeApp: mocks.initializeApp,
    credential: { cert: mocks.cert },
    auth: () => mocks.auth,
    firestore: () => mocks.firestore,
  },
}));
vi.mock('../../env/loadNodeEnv', () => ({ loadNodeEnv: vi.fn() }));

describe('Firebase Admin initialization', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.apps.length = 0;
  });

  it('initializes Firebase without modifying user permissions', async () => {
    const { adminAuth, adminDB } = await import('../firebase-admin');
    expect(mocks.initializeApp).toHaveBeenCalledOnce();
    expect(adminAuth).toBe(mocks.auth);
    expect(adminDB).toBe(mocks.firestore);
    expect(mocks.auth.setCustomUserClaims).not.toHaveBeenCalled();
  });

  it('reuses an existing Firebase app without modifying permissions', async () => {
    mocks.apps.push({});
    await import('../firebase-admin');
    expect(mocks.initializeApp).not.toHaveBeenCalled();
    expect(mocks.auth.setCustomUserClaims).not.toHaveBeenCalled();
  });
});
