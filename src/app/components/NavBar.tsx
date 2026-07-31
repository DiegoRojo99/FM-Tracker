'use client'

import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from './AuthProvider';
import { NavBarProfile } from './NavBarProfile';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/db/firebase';
import { useRouter } from 'next/navigation';

interface FriendRequestsCount {
  pendingCount: number
}


export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const adminUID = process.env.NEXT_PUBLIC_ADMIN_UID;
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);
  const desktopLinkClass = 'rounded-full px-4 py-2 text-sm font-medium text-[var(--color-foreground)]/85 hover:text-white hover:bg-white/10 transition';

  // Fetch pending friend requests for mobile navigation
  useEffect(() => {
    const fetchPendingRequests = async () => {
      if (!user) return

      try {
        const userToken = await user.getIdToken()
        const response = await fetch('/api/friends/requests/received?status=PENDING', {
          headers: {
            'Authorization': `Bearer ${userToken}`
          }
        })

        if (response.ok) {
          const data: FriendRequestsCount = await response.json()
          setPendingCount(data.pendingCount || 0)
        }
      } 
      catch (error) {
        console.error('Error fetching pending friend requests:', error)
      }
    }

    // Fetch initially
    fetchPendingRequests()

    // Fetch periodically (every 30 seconds)
    const interval = setInterval(fetchPendingRequests, 30000)

    return () => clearInterval(interval)
  }, [user])

  const handleMobileLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
      setOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0f1ede] text-[var(--color-foreground)] shadow-lg backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="text-xl font-bold tracking-tight">
          <Link href="/" className="group inline-flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--color-highlight)] shadow-[0_0_14px_var(--color-highlight)]" />
            <span className="text-white group-hover:text-[var(--color-highlight)] transition-colors">FM Tracker</span>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1">
          <Link href="/saves" className={desktopLinkClass}>Saves</Link>
          <Link href="/trophies" className={desktopLinkClass}>Trophies</Link>
          <Link href="/challenges" className={desktopLinkClass}>Challenges</Link>
          {user && user.uid === adminUID && (
            <Link href="/admin" className={desktopLinkClass}>Admin</Link>
          )}
          <NavBarProfile />
        </div>

        <div className="md:hidden">
          <button
            aria-label="Toggle menu"
            onClick={() => setOpen(!open)}
            className="rounded-md border border-white/15 bg-white/5 p-2 text-white"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/10 bg-[#0a0f1eee] px-4 pb-4 pt-3">
          <div className="glass-panel space-y-1 rounded-2xl p-3">
            <Link href="/saves" className="block rounded-xl px-3 py-2 text-sm font-medium hover:bg-white/10" onClick={() => setOpen(false)}>Saves</Link>
            <Link href="/trophies" className="block rounded-xl px-3 py-2 text-sm font-medium hover:bg-white/10" onClick={() => setOpen(false)}>Trophies</Link>
            <Link href="/challenges" className="block rounded-xl px-3 py-2 text-sm font-medium hover:bg-white/10" onClick={() => setOpen(false)}>Challenges</Link>
          
            {user && user.uid === adminUID && (
              <Link href="/admin" className="block rounded-xl px-3 py-2 text-sm font-medium hover:bg-white/10" onClick={() => setOpen(false)}>
                Admin
              </Link>
            )}
          
            {user && (
              <>
                <Link href="/friends" className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium hover:bg-white/10" onClick={() => setOpen(false)}>
                  <div className="flex items-center">
                    <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Friends</span>
                  </div>
                  {pendingCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </Link>
              
                <Link href="/add-save" className="flex items-center rounded-xl px-3 py-2 text-sm font-medium hover:bg-white/10" onClick={() => setOpen(false)}>
                  <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Save
                </Link>
              </>
            )}
          
            {user ? (
              <>
                <Link href="/profile" className="flex items-center rounded-xl px-3 py-2 text-sm font-medium hover:bg-white/10" onClick={() => setOpen(false)}>
                  <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  View Profile
                </Link>
              
                <button
                  onClick={handleMobileLogout}
                  className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-medium text-red-300 hover:bg-red-500/20"
                >
                  <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </>
            ) : (
              <Link href="/login" className="block rounded-xl px-3 py-2 text-sm font-medium hover:bg-white/10" onClick={() => setOpen(false)}>
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
