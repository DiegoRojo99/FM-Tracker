'use client'

import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { useState, useRef, useEffect } from "react";
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/db/firebase';
import { useRouter } from 'next/navigation';

export function NavBarProfile() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
      setIsOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) {
    return (
      <div className="hidden md:flex items-center space-x-4">
        <Link href="/login" className="hover:text-[var(--color-highlight)] px-4 py-2 rounded-lg transition-colors">
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="hidden md:flex items-center space-x-4 relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 hover:bg-[var(--color-darker)] px-3 py-2 rounded-lg transition-colors"
      >
        <div className="w-8 h-8 bg-[var(--color-accent)] rounded-full flex items-center justify-center text-white font-bold text-sm">
          {user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <span className="text-white text-sm font-medium truncate max-w-32">
          {user.displayName || user.email}
        </span>
        <svg 
          className={`w-4 h-4 text-gray-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--color-dark)] rounded-lg shadow-xl border border-[var(--color-darker)] z-50">
          <div className="p-3 border-b border-[var(--color-darker)]">
            <p className="text-white font-semibold truncate">{user.displayName || 'User'}</p>
            <p className="text-gray-400 text-sm truncate">{user.email}</p>
          </div>
          
          <div className="py-2">
            <Link 
              href="/profile" 
              className="flex items-center px-4 py-2 text-gray-300 hover:bg-[var(--color-darker)] hover:text-white transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              View Profile
            </Link>
            
            <Link 
              href="/add-save" 
              className="flex items-center px-4 py-2 text-gray-300 hover:bg-[var(--color-darker)] hover:text-white transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Save
            </Link>
            
            <Link 
              href="/friends" 
              className="flex items-center px-4 py-2 text-gray-300 hover:bg-[var(--color-darker)] hover:text-white transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Friends
            </Link>
          </div>

          <div className="py-2 border-t border-[var(--color-darker)]">
            <button 
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}