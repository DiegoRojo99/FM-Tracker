'use client'

import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
      router.push('/')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/')
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="max-w-md mx-auto py-20">
      <h2 className="text-2xl font-bold mb-6 text-center">Login to FM Tracker</h2>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <form onSubmit={handleEmailSignIn} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="w-full bg-[var(--color-primary)] text-white p-2 rounded font-semibold"
        >
          Sign In
        </button>
      </form>

      <div className="text-center my-6 text-sm text-gray-400">or</div>

      <button
        onClick={handleGoogleSignIn}
        className="w-full bg-[var(--color-highlight)] text-white p-2 rounded font-semibold"
      >
        Sign In with Google
      </button>
    </div>
  )
}
