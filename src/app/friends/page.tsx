'use client'

import { useAuth } from '@/app/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react'
import { User } from '@/lib/types/prisma/User';
import { FriendRequestWithReceiver, FriendRequestWithRequester } from '@/lib/types/prisma/Friends';
import FriendsList from './components/FriendsList';
import FriendRequests from './components/FriendRequests';
import SearchFriends from './components/SearchFriends';
import FootballLoader from '../components/FootBallLoader';
import FriendsLeaderboard from './components/FriendsLeaderboard';
import { Users, Inbox, Search, Trophy, Sparkles } from 'lucide-react';

type TabType = 'friends' | 'requests' | 'search' | 'leaderboard'

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
  const tabClass = (tab: TabType) => `inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
    activeTab === tab
      ? 'bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-highlight)] text-white shadow-lg'
      : 'text-gray-300 hover:bg-[var(--color-surface-soft)] hover:text-white'
  }`

  useEffect(() => {
    if (!user) {
      // router.push('/login')
      return;
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

  if (!user) {
    return (
      <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        <div className="rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 p-8 text-center shadow-xl backdrop-blur-sm">
          <h1 className="text-2xl font-black text-white">Friends & Social</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Login to view your social hub and leaderboard.</p>
        </div>
      </div>
    )
  }

  const pendingRequestsCount = data.friendRequests.received.filter(req => req.status === 'PENDING').length
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 p-5 shadow-xl backdrop-blur-sm sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-highlight)]">
                <Sparkles className="h-3.5 w-3.5" />
                Social Hub
              </p>
              <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">Friends & Social</h1>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">Grow your network, manage requests, and compare progress.</p>
            </div>

            <div className="rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
              <span className="font-semibold text-white">{data.friends.length}</span> friends • <span className="font-semibold text-white">{pendingRequestsCount}</span> pending requests
            </div>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-darker)]/60 p-2">
            <button onClick={() => setActiveTab('friends')} className={tabClass('friends')}>
              <Users className="h-4 w-4" />
              Friends ({data.friends.length})
            </button>
            <button onClick={() => setActiveTab('requests')} className={`${tabClass('requests')} relative`}>
              <Inbox className="h-4 w-4" />
              Requests
              {pendingRequestsCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                  {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                </span>
              )}
            </button>
            <button onClick={() => setActiveTab('search')} className={tabClass('search')}>
              <Search className="h-4 w-4" />
              Add Friends
            </button>
            <button onClick={() => setActiveTab('leaderboard')} className={tabClass('leaderboard')}>
              <Trophy className="h-4 w-4" />
              Leaderboard
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 p-4 shadow-2xl backdrop-blur-sm sm:p-7">
          {loading && (
            <div className="py-12">
              <FootballLoader />
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-xl border border-[var(--color-danger-soft-border)] bg-[var(--color-danger-soft-bg)] p-4 text-center text-[var(--color-danger-soft-text)]">
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
              {activeTab === 'leaderboard' && (
                <FriendsLeaderboard user={user} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}