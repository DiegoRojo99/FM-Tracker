'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="bg-[var(--color-dark)] text-[var(--color-foreground)] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo / Brand */}
        <div className="text-xl font-bold">
          <a href="/" className="hover:text-[var(--color-highlight)]">
            FM Tracker
          </a>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-6">
          <a href="#" className="hover:text-[var(--color-highlight)]">Dashboard</a>
          <a href="#" className="hover:text-[var(--color-highlight)]">Saves</a>
          <a href="#" className="hover:text-[var(--color-highlight)]">Achievements</a>
          <a href="#" className="hover:text-[var(--color-highlight)]">Challenges</a>
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
          <a href="#" className="block hover:text-[var(--color-highlight)]">Dashboard</a>
          <a href="#" className="block hover:text-[var(--color-highlight)]">Saves</a>
          <a href="#" className="block hover:text-[var(--color-highlight)]">Achievements</a>
          <a href="#" className="block hover:text-[var(--color-highlight)]">Challenges</a>
        </div>
      )}
    </nav>
  )
}
