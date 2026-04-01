'use client'

import { useAuth } from '@/app/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react'
import { User } from '@/lib/types/prisma/User';
import { FriendRequestWithReceiver, FriendRequestWithRequester } from '@/lib/types/prisma/Friends';
import FriendsList from './components/FriendsList';
import FriendRequests from './components/FriendRequests';
import SearchFriends from './components/SearchFriends';

type TabType = 'friends' | 'requests' | 'search'

interface FriendsData {
  friends: (User & { friendshipDate: Date })[]
  friendRequests: {
    sent: FriendRequestWithReceiver[]
    received: FriendRequestWithRequester[]
  }
}

export default function FriendsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('friends')
  const [data, setData] = useState<FriendsData>({
    friends: [],
    friendRequests: { sent: [], received: [] }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      // router.push('/login')
      return
    }
  }, [user, router])

  const fetchFriendsData = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      const userToken = await user.getIdToken()

      // Fetch friends, sent requests, and received requests in parallel
      const [friendsRes, sentReqRes, receivedReqRes] = await Promise.all([
        fetch('/api/friends', {
          headers: { 'Authorization': `Bearer ${userToken}` }
        }),
        fetch('/api/friends/requests/sent', {
          headers: { 'Authorization': `Bearer ${userToken}` }
        }),
        fetch('/api/friends/requests/received', {
          headers: { 'Authorization': `Bearer ${userToken}` }
        })
      ])

      if (!friendsRes.ok || !sentReqRes.ok || !receivedReqRes.ok) {
        throw new Error('Failed to fetch friends data')
      }

      const [friendsData, sentReqData, receivedReqData] = await Promise.all([
        friendsRes.json(),
        sentReqRes.json(),
        receivedReqRes.json()
      ])

      setData({
        friends: friendsData.friends || [],
        friendRequests: {
          sent: sentReqData.requests || [],
          received: receivedReqData.requests || []
        }
      })
    } 
    catch (err) {
      setError('Failed to load friends data')
      console.error('Error fetching friends data:', err)
    } 
    finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchFriendsData()
  }, [user, fetchFriendsData])

  const handleDataUpdate = () => {
    fetchFriendsData() // Refresh data after actions
  }

  if (!user) return null
  const pendingRequestsCount = data.friendRequests.received.filter(req => req.status === 'PENDING').length
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-darker)] to-[var(--color-dark)] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-[var(--color-dark)] rounded-xl shadow-2xl p-8 mb-8">
          <h1 className="text-3xl font-bold text-white mb-6">
            👥 Friends & Social
          </h1>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-[var(--color-darker)] rounded-lg p-1">
            <button
              onClick={() => setActiveTab('friends')}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'friends'
                  ? 'bg-[var(--color-accent)] text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-[var(--color-dark)]'
              }`}
            >
              Friends ({data.friends.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 relative ${
                activeTab === 'requests'
                  ? 'bg-[var(--color-accent)] text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-[var(--color-dark)]'
              }`}
            >
              Requests
              {pendingRequestsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'search'
                  ? 'bg-[var(--color-accent)] text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-[var(--color-dark)]'
              }`}
            >
              Add Friends
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-[var(--color-dark)] rounded-xl shadow-2xl p-8">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]"></div>
              <p className="text-gray-300 mt-4">Loading...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-200 text-center mb-6">
              {error}
              <button 
                onClick={fetchFriendsData}
                className="ml-4 underline hover:no-underline"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {activeTab === 'friends' && (
                <FriendsList 
                  friends={data.friends}
                  onUpdate={handleDataUpdate}
                  user={user}
                />
              )}
              {activeTab === 'requests' && (
                <FriendRequests
                  sentRequests={data.friendRequests.sent}
                  receivedRequests={data.friendRequests.received}
                  onUpdate={handleDataUpdate}
                  user={user}
                />
              )}
              {activeTab === 'search' && (
                <SearchFriends
                  onUpdate={handleDataUpdate}
                  user={user}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}