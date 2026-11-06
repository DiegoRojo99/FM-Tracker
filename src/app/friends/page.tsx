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
import SocialFeed from './SocialFeed';
import { Users, Inbox, Search, Trophy, Sparkles, Activity } from 'lucide-react';

type TabType = 'feed' | 'leaderboard' | 'friends' | 'requests' | 'search'

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
  const [activeTab, setActiveTab] = useState<TabType>('feed')
  const [data, setData] = useState<FriendsData>({
    friends: [],
    friendRequests: { sent: [], received: [] }
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const tabClass = 'fm-choice shrink-0 whitespace-nowrap';

  useEffect(() => {
    if (!user) return;
  }, [user, router])

  const fetchFriendsData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const userToken = await user.getIdToken();

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
        <div className="fm-panel p-6 text-center">
          <h1 className="text-2xl font-semibold text-white">Friends & Social</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Login to view your social hub and leaderboard.</p>
        </div>
      </div>
    )
  }

  const pendingRequestsCount = data.friendRequests.received.filter(req => req.status === 'PENDING').length
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="fm-panel mb-5 p-4 sm:p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
                <Sparkles className="h-3.5 w-3.5" />
                Social Hub
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Friends & Social</h1>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">Grow your network, manage requests, and compare progress.</p>
            </div>

            <div className="fm-inset px-3 py-2 text-sm text-[var(--color-text-muted)]">
              <span className="font-semibold text-white">{data.friends.length}</span> friends • <span className="font-semibold text-white">{pendingRequestsCount}</span> pending requests
            </div>
          </div>

          <div aria-label="Social views" className="mt-4 flex gap-2 overflow-x-auto p-1">
            <button onClick={() => setActiveTab('feed')} aria-pressed={activeTab === 'feed'} className={tabClass}>
              <Activity className="h-4 w-4" />
              Feed
            </button>
            <button onClick={() => setActiveTab('leaderboard')} aria-pressed={activeTab === 'leaderboard'} className={tabClass}>
              <Trophy className="h-4 w-4" />
              Leaderboard
            </button>
            <button onClick={() => setActiveTab('friends')} aria-pressed={activeTab === 'friends'} className={tabClass}>
              <Users className="h-4 w-4" />
              Friends ({data.friends.length})
            </button>
            <button onClick={() => setActiveTab('requests')} aria-pressed={activeTab === 'requests'} className={`${tabClass} relative`}>
              <Inbox className="h-4 w-4" />
              Requests
              {pendingRequestsCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                  {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                </span>
              )}
            </button>
            <button onClick={() => setActiveTab('search')} aria-pressed={activeTab === 'search'} className={tabClass}>
              <Search className="h-4 w-4" />
              Add Friends
            </button>
          </div>
        </div>

        <div className="fm-panel p-4 sm:p-5">
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
              {activeTab === 'feed' && (
                <div>
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-white">Activity Feed</h2>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">Recent save milestones, challenge completions, trophies, and friend activity.</p>
                  </div>
                  <SocialFeed />
                </div>
              )}
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