'use client'

import { createContext, useEffect, useState, useContext } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/db/firebase';
import { createUserIfNotExists } from '@/lib/db/firestore';

const AuthContext = createContext<{ user: User | null, userLoading: boolean }>({ user: null, userLoading: true })

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
