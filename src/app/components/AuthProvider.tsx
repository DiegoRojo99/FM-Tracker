'use client'

import { createContext, useEffect, useState, useContext } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/db/firebase';

const AuthContext = createContext<{ user: User | null, userLoading: boolean }>({ user: null, userLoading: true })

const createUserIfNotExists = async (firebaseUser: User) => {
  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || 'Anonymous',
        photoURL: firebaseUser.photoURL || '',
      }),
    });

    if (!response.ok) {
      console.error('Failed to create user:', await response.text());
    }
  } catch (error) {
    console.error('Error creating user:', error);
  }
};

export const useAuth = () => useContext(AuthContext)
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setUserLoading(false);
      if (firebaseUser) {
        await createUserIfNotExists(firebaseUser)
      }
    })

    return () => unsubscribe()
  }, [])

  return <AuthContext.Provider value={{ user, userLoading }}>{children}</AuthContext.Provider>
}
