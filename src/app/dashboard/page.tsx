'use client'

import { useAuth } from '@/app/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Dashboard() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) router.push('/login')
  }, [user])

  if (!user) return null

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Welcome, {user.displayName || user.email}</h1>
    </div>
  )
}
