'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from './AuthProvider';
import { NavBarProfile } from './NavBarProfile';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

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
          {/* <Link href="#" className="hover:text-[var(--color-highlight)]">Achievements</Link> */}
          <Link href="#" className="hover:text-[var(--color-highlight)]">Challenges</Link>
          
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
        <div className="md:hidden bg-[var(--color-dark)] px-4 pb-4 space-y-2">
          {/* <Link href="#" className="block hover:text-[var(--color-highlight)]">Dashboard</Link> */}
          <Link href="/saves" className="block hover:text-[var(--color-highlight)]">Saves</Link>
          <Link href="/trophies" className="block hover:text-[var(--color-highlight)]">Trophies</Link>
          {/* <Link href="#" className="block hover:text-[var(--color-highlight)]">Achievements</Link> */}
          <Link href="#" className="block hover:text-[var(--color-highlight)]">Challenges</Link>
          { user ? (
            <Link href="/profile" className="block hover:text-[var(--color-highlight)]">
              Profile
            </Link>
          ) : (
            <Link href="/login" className="block hover:text-[var(--color-highlight)]">
              Login
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
