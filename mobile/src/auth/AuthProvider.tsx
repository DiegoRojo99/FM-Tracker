import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { createApiClient, type ApiClient } from '../lib/api';
import { getApiUrl } from '../lib/config';
import { getFirebaseAuth } from '../lib/firebase';

type AuthState = {
  user: User | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt(value => value + 1), []);

  useEffect(() => {
    let active = true;
    let revision = 0;
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async firebaseUser => {
      if (!active) return;
      const current = ++revision;
      setLoading(true);
      setError(null);
      setUser(null);
      try {
        if (firebaseUser) {
          const request = createApiClient(getApiUrl(), firebaseUser);
          await request('/api/users', {
            method: 'POST',
            body: JSON.stringify({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || 'Manager',
              photoURL: firebaseUser.photoURL || '',
            }),
          });
        }
        if (active && current === revision) setUser(firebaseUser);
      } catch (err) {
        if (active && current === revision) setError(err instanceof Error ? err.message : 'Unable to load your account.');
      } finally {
        if (active && current === revision) setLoading(false);
      }
    }, err => {
      if (!active) return;
      revision++;
      setUser(null);
      setError(err.message);
      setLoading(false);
    });
    return () => { active = false; unsubscribe(); };
  }, [attempt]);

  return (
    <AuthContext.Provider value={{ user, loading, error, retry }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}

export function useApi(): ApiClient {
  const { user } = useAuth();
  return useMemo(() => {
    if (!user) throw new Error('Sign in before accessing FM Tracker.');
    return createApiClient(getApiUrl(), user);
  }, [user]);
}

export function logout() {
  return signOut(getFirebaseAuth());
}
