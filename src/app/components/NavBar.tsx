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
    <nav className="bg-[var(--color-dark)] text-[var(--color-foreground)] shadow-md">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo / Brand */}
        <div className="text-xl font-bold">
          <Link href="/" className="hover:text-[var(--color-highlight)]">
            FM Tracker
          </Link>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-6">
          {/* <Link href="dashboard" className="flex items-center hover:text-[var(--color-highlight)]">Dashboard</Link> */}

          {/* Uncomment these links when implemented */}
          <Link href="/saves" className="flex hover:text-[var(--color-highlight)]">
            <p className='h-fit my-auto'>Saves</p>
          </Link>
          <Link href="/trophies" className="flex hover:text-[var(--color-highlight)]">
            <p className='h-fit my-auto'>Trophies</p>
          </Link>
          <Link href="/challenges" className="flex hover:text-[var(--color-highlight)]">
            <p className='h-fit my-auto'>Challenges</p>
          </Link>
          {/* <Link href="#" className="hover:text-[var(--color-highlight)]">Achievements</Link> */}
          {user && user.uid === adminUID && (
            <Link href="/admin" className="flex hover:text-[var(--color-highlight)]">
              <p className='h-fit my-auto'>Admin</p>
            </Link>
          )}
          <NavBarProfile />
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <button onClick={() => setOpen(!open)}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {open && (
        <div className="md:hidden bg-[var(--color-darker)] border-t border-[var(--color-dark)] px-4 pb-4 space-y-2">
          {/* <Link href="#" className="block hover:text-[var(--color-highlight)]">Dashboard</Link> */}
          <Link href="/saves" className="block hover:text-[var(--color-highlight)] py-2" onClick={() => setOpen(false)}>Saves</Link>
          <Link href="/trophies" className="block hover:text-[var(--color-highlight)] py-2" onClick={() => setOpen(false)}>Trophies</Link>
          {/* <Link href="#" className="block hover:text-[var(--color-highlight)]">Achievements</Link> */}
          <Link href="/challenges" className="block hover:text-[var(--color-highlight)] py-2" onClick={() => setOpen(false)}>Challenges</Link>
          
          {user && user.uid === adminUID && (
            <Link href="/admin" className="block hover:text-[var(--color-highlight)] py-2" onClick={() => setOpen(false)}>
              Admin
            </Link>
          )}
          
          {user && (
            <>
              <Link href="/friends" className="flex items-center justify-between hover:text-[var(--color-highlight)] py-2" onClick={() => setOpen(false)}>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Friends</span>
                </div>
                {pendingCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </Link>
              
              <Link href="/add-save" className="flex items-center hover:text-[var(--color-highlight)] py-2" onClick={() => setOpen(false)}>
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Save
              </Link>
            </>
          )}
          
          {/* Profile or Login Link */}
          {user ? (
            <>
              <Link href="/profile" className="flex items-center hover:text-[var(--color-highlight)] py-2" onClick={() => setOpen(false)}>
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                View Profile
              </Link>
              
              <button 
                onClick={handleMobileLogout}
                className="flex items-center w-full text-left hover:text-red-300 py-2 text-red-400"
              >
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/login" className="block hover:text-[var(--color-highlight)] py-2" onClick={() => setOpen(false)}>
              Login
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
