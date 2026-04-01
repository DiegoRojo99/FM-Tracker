'use client'

import Link from 'next/link'
import { useAuth } from './AuthProvider'
import { useState, useEffect } from 'react'

interface FriendRequestsCount {
  pendingCount: number
}

export function FriendsNavLink({ className, onClick }: { className: string, onClick?: () => void }) {
  const { user } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)

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

  return (
    <Link href="/friends" className={className} onClick={onClick}>
      <div className="relative h-fit my-auto">
        <span>Friends</span>
        {pendingCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {pendingCount > 9 ? '9+' : pendingCount}
          </span>
        )}
      </div>
    </Link>
  )
}