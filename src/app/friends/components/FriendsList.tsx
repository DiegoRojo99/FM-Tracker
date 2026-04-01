'use client'

import { User } from 'firebase/auth'
import { User as PrismaUser } from '@/lib/types/prisma/User'
import { useState } from 'react'
import { GradientButton } from '@/app/components/GradientButton'
import { useRouter } from 'next/navigation'

interface FriendsListProps {
  friends: (PrismaUser & { friendshipDate: Date })[]
  onUpdate: () => void
  user: User
}

export default function FriendsList({ friends, onUpdate, user }: FriendsListProps) {
  const [removing, setRemoving] = useState<string | null>(null)
  const router = useRouter()

  const handleRemoveFriend = async (friendId: string, friendName: string) => {
    if (!confirm(`Are you sure you want to remove ${friendName} from your friends?`)) {
      return
    }

    try {
      setRemoving(friendId)
      const userToken = await user.getIdToken()
      
      const response = await fetch('/api/friends/remove', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ friendId })
      })

      if (!response.ok) {
        throw new Error('Failed to remove friend')
      }

      onUpdate() // Refresh the friends list
    } catch (error) {
      console.error('Error removing friend:', error)
      alert('Failed to remove friend. Please try again.')
    } finally {
      setRemoving(null)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (friends.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">👫</div>
        <h3 className="text-xl font-semibold text-white mb-2">
          No friends yet
        </h3>
        <p className="text-gray-300 mb-6">
          Start building your network by searching for friends to connect with!
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">
          Your Friends ({friends.length})
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {friends.map((friend) => (
          <div
            key={friend.uid}
            className="bg-[var(--color-darker)] rounded-lg p-6 hover:bg-[var(--color-darker)]/80 transition-all duration-200"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-[var(--color-accent)] rounded-full flex items-center justify-center text-white font-bold text-lg">
                {friend.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold truncate">
                  {friend.displayName}
                </h3>
                <p className="text-gray-300 text-sm truncate">
                  {friend.email}
                </p>
              </div>
            </div>

            <div className="text-gray-400 text-xs mb-4">
              Friends since {formatDate(friend.friendshipDate)}
            </div>

            <div className="flex space-x-2">
              <GradientButton
                size="sm"
                width="full"
                onClick={() => router.push(`/profile/${friend.uid}`)}
                className="flex-1"
              >
                View Profile
              </GradientButton>
              <GradientButton
                size="sm"
                destructive
                onClick={() => handleRemoveFriend(friend.uid, friend.displayName)}
                disabled={removing === friend.uid}
                className="px-3"
              >
                {removing === friend.uid ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  '🗑️'
                )}
              </GradientButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}