'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Menu,
  X,
  Save,
  Trophy,
  Target,
  Star,
  Shield,
  Users,
  Plus,
  UserCircle,
  LogIn,
  LogOut,
} from 'lucide-react'
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
  const navRef = useRef<HTMLElement>(null);
  const { user } = useAuth();
  const adminUID = process.env.NEXT_PUBLIC_ADMIN_UID;
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);
  const desktopLinkClass = 'inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-[var(--color-foreground)]/88 hover:text-white hover:bg-[var(--color-surface-strong)] transition';
  const mobileLinkClass = 'mobile-menu-item flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[var(--color-foreground)]/90 hover:bg-[var(--color-surface-soft)] hover:text-white transition';

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

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [open]);

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
    <nav ref={navRef} className="sticky top-0 z-50 border-b border-[var(--color-surface-border)] bg-[var(--color-background)]/90 text-[var(--color-foreground)] shadow-lg backdrop-blur-xl">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between my-1 px-4 sm:px-6 lg:px-8">
        <div className="text-xl font-bold tracking-tight">
          <Link href="/" className="group inline-flex items-center gap-2" onClick={() => setOpen(false)}>
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--color-highlight)] shadow-[0_0_14px_var(--color-highlight)]" />
            <span className="text-white group-hover:text-[var(--color-highlight)] transition-colors">FM Tracker</span>
          </Link>
        </div>

        <div className="my-2 hidden md:flex items-center gap-2 rounded-full border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] px-1.5 py-1">
          <Link href="/saves" className={desktopLinkClass}><Save className="h-4 w-4" />Saves</Link>
          <Link href="/trophies" className={desktopLinkClass}><Trophy className="h-4 w-4" />Trophies</Link>
          <Link href="/challenges" className={desktopLinkClass}><Target className="h-4 w-4" />Challenges</Link>
          <Link href="/achievements" className={desktopLinkClass}><Star className="h-4 w-4" />Achievements</Link>
          {user && user.uid === adminUID && (
            <Link href="/admin" className={desktopLinkClass}><Shield className="h-4 w-4" />Admin</Link>
          )}
          <NavBarProfile />
        </div>

        <div className="md:hidden">
          <button
            aria-label="Toggle menu"
            onClick={() => setOpen(!open)}
            className="rounded-md border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] p-2 text-white"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-[var(--color-surface-border)] bg-[var(--color-background)]/95 px-2 pb-2 pt-1">
          <div className="mobile-menu-panel overflow-hidden rounded-md border border-[var(--color-surface-border)] bg-[var(--color-dark)]/95 backdrop-blur-sm">
            <Link href="/saves" className={mobileLinkClass} style={{ animationDelay: '40ms' }} onClick={() => setOpen(false)}><Save className="h-4 w-4" />Saves</Link>
            <Link href="/trophies" className={mobileLinkClass} style={{ animationDelay: '80ms' }} onClick={() => setOpen(false)}><Trophy className="h-4 w-4" />Trophies</Link>
            <Link href="/challenges" className={mobileLinkClass} style={{ animationDelay: '120ms' }} onClick={() => setOpen(false)}><Target className="h-4 w-4" />Challenges</Link>
            <Link href="/achievements" className={mobileLinkClass} style={{ animationDelay: '140ms' }} onClick={() => setOpen(false)}><Star className="h-4 w-4" />Achievements</Link>
          
            {user && user.uid === adminUID && (
              <Link href="/admin" className={mobileLinkClass} style={{ animationDelay: '160ms' }} onClick={() => setOpen(false)}>
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}
          
            {user && (
              <>
                <Link href="/friends" className={`${mobileLinkClass} justify-between`} style={{ animationDelay: '200ms' }} onClick={() => setOpen(false)}>
                  <div className="flex items-center">
                    <Users className="mr-3 h-4 w-4" />
                    <span>Friends</span>
                  </div>
                  {pendingCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </Link>
              
                <Link href="/add-save" className={mobileLinkClass} style={{ animationDelay: '240ms' }} onClick={() => setOpen(false)}>
                  <Plus className="h-4 w-4" />
                  Add Save
                </Link>
              </>
            )}
          
            {user ? (
              <>
                <Link href="/profile" className={mobileLinkClass} style={{ animationDelay: '280ms' }} onClick={() => setOpen(false)}>
                  <UserCircle className="h-4 w-4" />
                  View Profile
                </Link>
              
                <button
                  onClick={handleMobileLogout}
                  style={{ animationDelay: '320ms' }}
                  className="mobile-menu-item flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-red-300 transition hover:bg-red-500/20"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link href="/login" className={mobileLinkClass} style={{ animationDelay: '200ms' }} onClick={() => setOpen(false)}>
                <LogIn className="h-4 w-4" />
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
