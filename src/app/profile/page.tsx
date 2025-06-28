'use client'

import { useAuth } from '@/app/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/db/firebase'

export default function Profile() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) router.push('/login')
  }, [user, router])

  const handleLogout = async () => {
    await signOut(auth)
    router.push('/login')
  }

  if (!user) return null

  return (
    <div className="p-6 mt-8 w-full h-full justify-center items-center flex flex-col">
      <h1 className="text-2xl font-bold mb-4">
        Welcome, {user.displayName || user.email}
      </h1>
      <button
        onClick={() => handleLogout()}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition cursor-pointer"
      >
        Logout
      </button>
    </div>
  )
}
