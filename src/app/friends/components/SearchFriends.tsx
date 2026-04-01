'use client'

import { User } from 'firebase/auth'
import { UserWithRelationshipStatus } from '@/lib/types/prisma/Friends'
import { useState } from 'react'
import { GradientButton } from '@/app/components/GradientButton'

interface SearchFriendsProps {
  onUpdate: () => void
  user: User
}

export default function SearchFriends({ onUpdate, user }: SearchFriendsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserWithRelationshipStatus[]>([])
  const [searching, setSearching] = useState(false)
  const [sendingRequest, setSendingRequest] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [showMessage, setShowMessage] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      alert('Please enter at least 2 characters to search')
      return
    }

    try {
      setSearching(true)
      const userToken = await user.getIdToken()
      
      const response = await fetch(`/api/friends/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to search users')
      }

      const data = await response.json()
      setSearchResults(data.users || [])
    } catch (error) {
      console.error('Error searching users:', error)
      alert('Failed to search users. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  const handleSendRequest = async (receiverEmail: string, receiverId: string) => {
    try {
      setSendingRequest(receiverId)
      const userToken = await user.getIdToken()
      
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          receiverEmail,
          message: message.trim() || undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send friend request')
      }

      // Update the search results to reflect the new status
      await handleSearch()
      setMessage('')
      setShowMessage(false)
      onUpdate() // Refresh main data
    } catch (error: any) {
      console.error('Error sending friend request:', error)
      alert(error.message || 'Failed to send friend request. Please try again.')
    } finally {
      setSendingRequest(null)
    }
  }

  const getStatusDisplay = (status: string, canSendRequest: boolean) => {
    switch (status) {
      case 'friend':
        return { text: '✓ Friends', color: 'text-green-400', bgColor: 'bg-green-500/20' }
      case 'request_sent_pending':
        return { text: '⏳ Request Sent', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' }
      case 'request_sent_rejected':
        return { text: '✗ Request Rejected', color: 'text-red-400', bgColor: 'bg-red-500/20' }
      case 'request_sent_blocked':
        return { text: '🚫 Blocked', color: 'text-red-600', bgColor: 'bg-red-600/20' }
      case 'request_received_pending':
        return { text: '📨 Sent You Request', color: 'text-blue-400', bgColor: 'bg-blue-500/20' }
      default:
        return canSendRequest 
          ? { text: 'Send Request', color: 'text-white', bgColor: '' }
          : { text: 'Unavailable', color: 'text-gray-400', bgColor: 'bg-gray-500/20' }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-4">
          🔍 Search & Add Friends
        </h2>
        
        {/* Search Input */}
        <div className="flex space-x-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 bg-[var(--color-darker)] text-white rounded-lg border border-gray-600 focus:border-[var(--color-accent)] focus:outline-none transition-colors"
            />
          </div>
          <GradientButton
            onClick={handleSearch}
            disabled={searching || searchQuery.length < 2}
            className="px-6"
          >
            {searching ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Search'
            )}
          </GradientButton>
        </div>

        {/* Optional Message Section */}
        <div className="mb-4">
          <button
            onClick={() => setShowMessage(!showMessage)}
            className="text-[var(--color-accent)] hover:text-white text-sm transition-colors"
          >
            {showMessage ? '▼ Hide Message' : '▶ Add optional message to friend requests'}
          </button>
          
          {showMessage && (
            <div className="mt-2">
              <textarea
                placeholder="Leave a message with your friend request (optional)..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                maxLength={200}
                className="w-full px-4 py-3 bg-[var(--color-darker)] text-white rounded-lg border border-gray-600 focus:border-[var(--color-accent)] focus:outline-none transition-colors resize-none"
              />
              <div className="text-gray-400 text-xs mt-1">
                {message.length}/200 characters
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Search Results ({searchResults.length})
          </h3>
          <div className="grid gap-4">
            {searchResults.map((searchUser) => {
              const statusDisplay = getStatusDisplay(searchUser.relationshipStatus, searchUser.canSendRequest)
              
              return (
                <div
                  key={searchUser.uid}
                  className="bg-[var(--color-darker)] rounded-lg p-6 hover:bg-[var(--color-darker)]/80 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-[var(--color-accent)] rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {searchUser.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-semibold truncate">
                          {searchUser.displayName}
                        </h4>
                        <p className="text-gray-300 text-sm truncate">
                          {searchUser.email}
                        </p>
                        <p className="text-gray-400 text-xs">
                          Joined {new Date(searchUser.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Status Badge */}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusDisplay.color} ${statusDisplay.bgColor}`}>
                        {statusDisplay.text}
                      </span>

                      {/* Action Button */}
                      {searchUser.canSendRequest && (
                        <GradientButton
                          size="sm"
                          onClick={() => handleSendRequest(searchUser.email, searchUser.uid)}
                          disabled={sendingRequest === searchUser.uid}
                        >
                          {sendingRequest === searchUser.uid ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            '+ Add Friend'
                          )}
                        </GradientButton>
                      )}
                      
                      {searchUser.relationshipStatus === 'request_received_pending' && (
                        <GradientButton
                          size="sm"
                          onClick={() => {
                            // Navigate to requests tab to respond
                            alert('Please go to the Requests tab to respond to this friend request.')
                          }}
                        >
                          Respond
                        </GradientButton>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* No Results */}
      {searchResults.length === 0 && searchQuery && !searching && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-white mb-2">
            No users found
          </h3>
          <p className="text-gray-300">
            Try different search terms or check the spelling.
          </p>
        </div>
      )}

      {/* Search Tips */}
      {!searchQuery && searchResults.length === 0 && (
        <div className="bg-[var(--color-darker)] rounded-lg p-6 border border-gray-600">
          <h3 className="text-white font-semibold mb-3">💡 Search Tips</h3>
          <ul className="text-gray-300 space-y-2 text-sm">
            <li>• Search by display name or email address</li>
            <li>• Use at least 2 characters for better results</li>
            <li>• Add an optional message to personalize your friend request</li>
            <li>• You can see the relationship status with each user</li>
          </ul>
        </div>
      )}
    </div>
  )
}