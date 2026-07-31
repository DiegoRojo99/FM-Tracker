'use client'

import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/db/firebase'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn, Mail, Lock, Sparkles } from 'lucide-react'

function getFriendlyAuthError(err: unknown): string {
  const code = typeof err === 'object' && err !== null && 'code' in err
    ? String((err as { code: unknown }).code) : '';

  const messageMap: Record<string, string> = {
    'auth/invalid-credential': 'Invalid email or password. Please try again.',
    'auth/wrong-password': 'Invalid email or password. Please try again.',
    'auth/user-not-found': 'Invalid email or password. Please try again.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/missing-password': 'Please enter your password.',
    'auth/too-many-requests': 'Too many login attempts. Please wait a few minutes and try again.',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
    'auth/popup-closed-by-user': 'Google sign-in was canceled before completion.',
    'auth/popup-blocked': 'Your browser blocked the sign-in popup. Allow popups and try again.',
    'auth/cancelled-popup-request': 'Another sign-in attempt is already in progress.',
  }

  if (code && messageMap[code]) return messageMap[code];
  return 'Sign-in failed. Please try again.';
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loadingEmailSignIn, setLoadingEmailSignIn] = useState(false)
  const [loadingGoogleSignIn, setLoadingGoogleSignIn] = useState(false)

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider()
    setError('')
    setLoadingGoogleSignIn(true)

    try {
      await signInWithPopup(auth, provider)
      router.push('/')
    } 
    catch (err) {
      setError(getFriendlyAuthError(err))
    }
    finally {
      setLoadingGoogleSignIn(false)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoadingEmailSignIn(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/')
    } 
    catch (err) {
      setError(getFriendlyAuthError(err))
    }
    finally {
      setLoadingEmailSignIn(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-12 sm:px-6 sm:py-16">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-[10%] top-[12%] h-40 w-40 rounded-full bg-[var(--color-accent)]/20 blur-3xl" />
        <div className="absolute right-[10%] top-[18%] h-48 w-48 rounded-full bg-[var(--color-highlight)]/20 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="hidden lg:block">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-highlight)]">
            <Sparkles className="h-3.5 w-3.5" />
            Welcome Back
          </p>
          <h1 className="text-4xl font-black leading-tight text-white">
            Continue your Football Manager legacy.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-[var(--color-text-muted)]">
            Sign in to keep tracking saves, trophies, and challenge progress across every era of your career.
          </p>
        </div>

        <div className="rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/92 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
          <h2 className="text-2xl font-bold text-white">Login to FM Tracker</h2>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Use your account to pick up where you left off.</p>

          {error && (
            <p className="mt-4 rounded-lg border border-[var(--color-danger-soft-border)] bg-[var(--color-danger-soft-bg)] px-4 py-3 text-sm text-[var(--color-danger-soft-text)]">
              {error}
            </p>
          )}

          <form onSubmit={handleEmailSignIn} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-gray-200">
                <Mail className="h-4 w-4" />
                Email
              </span>
              <input
                type="email"
                placeholder="you@club.com"
                className="w-full rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-4 py-3 text-white placeholder:text-gray-400 focus:border-[var(--color-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-highlight)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-dark)]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </label>

            <label className="block">
              <span className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-gray-200">
                <Lock className="h-4 w-4" />
                Password
              </span>
              <input
                type="password"
                placeholder="Enter password"
                className="w-full rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-4 py-3 text-white placeholder:text-gray-400 focus:border-[var(--color-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-highlight)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-dark)]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-highlight)] px-4 py-3 font-semibold text-white shadow-lg transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-highlight)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-dark)] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!email || !password || loadingEmailSignIn || loadingGoogleSignIn}
            >
              <LogIn className="h-4 w-4" />
              {loadingEmailSignIn ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="my-6 text-center text-xs uppercase tracking-[0.18em] text-gray-400">or</div>

          <button
            onClick={handleGoogleSignIn}
            className="w-full rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] px-4 py-3 font-semibold text-white transition hover:bg-[var(--color-surface-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-highlight)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-dark)] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loadingEmailSignIn || loadingGoogleSignIn}
          >
            {loadingGoogleSignIn ? 'Connecting...' : 'Sign In with Google'}
          </button>
        </div>
      </div>
    </div>
  )
}
