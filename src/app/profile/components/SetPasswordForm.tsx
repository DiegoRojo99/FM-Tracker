'use client'

import { useRef, useState, type FormEvent } from 'react'
import { EmailAuthProvider, GoogleAuthProvider, linkWithCredential, reauthenticateWithPopup, type User } from 'firebase/auth'
import { auth } from '@/lib/db/firebase'
import { GradientButton } from '@/app/components/GradientButton'

function linkingError(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : ''
  const messages: Record<string, string> = {
    'auth/weak-password': 'Please choose a stronger password that meets the Firebase password policy.',
    'auth/password-does-not-meet-requirements': 'Please choose a stronger password that meets the Firebase password policy.',
    'auth/provider-already-linked': 'Password sign-in is already enabled for this account.',
    'auth/email-already-in-use': 'This email is already linked to another account. No accounts have been merged.',
    'auth/credential-already-in-use': 'These credentials are already linked to another account. No accounts have been merged.',
    'auth/popup-closed-by-user': 'Google verification was canceled. Your password has not been added.',
    'auth/cancelled-popup-request': 'Another Google verification is already in progress.',
    'auth/popup-blocked': 'Your browser blocked Google verification. Allow popups and try again.',
    'auth/user-mismatch': 'Choose the same Google account you used to sign in to FM Tracker.',
    'auth/requires-recent-login': 'Please sign out and sign in with Google again, then retry.',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
    'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
    'auth/operation-not-allowed': 'Email/password sign-in is not enabled. Please contact support.',
  }
  return messages[code] || 'Unable to set up password sign-in. Please try again.'
}

export default function SetPasswordForm({ user }: { user: User }) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [linked, setLinked] = useState(false)
  const lock = useRef(false)
  const hasGoogle = user.providerData.some(provider => provider.providerId === 'google.com')
  const hasPassword = user.providerData.some(provider => provider.providerId === 'password')

  if ((!hasGoogle || hasPassword) && !linked) return null

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (lock.current) return
    setError('')
    if (!password || password !== confirmation) {
      setError(password ? 'Passwords do not match.' : 'Please enter a password.')
      return
    }
    const currentUser = auth.currentUser
    if (!currentUser || currentUser.uid !== user.uid || !currentUser.email) {
      setError('Your session has changed. Sign in to your account again before setting up a password.')
      return
    }
    if (currentUser.providerData.some(provider => provider.providerId === 'password')) {
      setError('Password sign-in is already enabled for this account.')
      return
    }
    const email = currentUser.email
    lock.current = true
    setBusy(true)
    try {
      await reauthenticateWithPopup(currentUser, new GoogleAuthProvider())
      if (auth.currentUser?.uid !== currentUser.uid || currentUser.email !== email) {
        setError('Your session has changed. Sign in to your account again before setting up a password.')
        return
      }
      await linkWithCredential(currentUser, EmailAuthProvider.credential(email, password))
      setPassword('')
      setConfirmation('')
      setLinked(true)
    } catch (err) {
      setError(linkingError(err))
    } finally {
      lock.current = false
      setBusy(false)
    }
  }

  return (
    <section className="fm-panel mb-5 p-4 sm:p-5" aria-labelledby="password-setup-heading">
      <h2 id="password-setup-heading" className="text-xl font-semibold text-[var(--color-foreground)]">Set up password</h2>
      {linked ? (
        <p role="status" className="mt-3 text-sm text-[var(--color-success)]">
          Password sign-in is enabled. You can now sign in with {user.email} and your password. Your Google sign-in and existing saves are unchanged.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-3 max-w-md space-y-4">
          <p className="text-sm text-[var(--color-text-muted)]">
            Add email/password as another way to sign in to your FM Tracker account.
            We will verify your Google account first. Your existing saves stay on the same account.
          </p>
          <p className="break-all text-sm text-[var(--color-text-muted)]">Email: {user.email}</p>
          <label className="block">
            <span className="mb-2 block text-sm text-[var(--color-text-muted)]">New password</span>
            <input name="newPassword" type="password" autoComplete="new-password" className="fm-field" value={password} onChange={event => setPassword(event.target.value)} disabled={busy} required />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-[var(--color-text-muted)]">Confirm password</span>
            <input name="confirmPassword" type="password" autoComplete="new-password" className="fm-field" value={confirmation} onChange={event => setConfirmation(event.target.value)} disabled={busy} required />
          </label>
          {error && <p role="alert" className="text-sm text-[var(--color-danger-soft-text)]">{error}</p>}
          <GradientButton type="submit" disabled={busy || !password || !confirmation}>
            {busy ? 'Setting up password...' : 'Verify with Google and set password'}
          </GradientButton>
        </form>
      )}
    </section>
  )
}
