'use client'

import { useAuth } from '@/app/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { User, UserWithStatus } from '@/lib/types/prisma/User'
import { UserStats } from '@/lib/types/prisma/Stats'
import { GradientButton } from '@/app/components/GradientButton'
import FootballLoader from '@/app/components/FootBallLoader'
import { Calendar, Crown, ShieldCheck, Sparkles, Trophy, Users, Volleyball } from 'lucide-react'

interface ProfileViewProps {
  userId?: string // If provided, show that user's profile; otherwise show current user
}

interface UserProfile {
  user: User
  stats: UserStats
  isOwnProfile: boolean
  friendshipStatus?: UserWithStatus['relationshipStatus']
}

export default function ProfileView({ userId }: ProfileViewProps) {
  const { user: currentUser, userLoading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sendingRequest, setSendingRequest] = useState(false)

  // Determine target user ID
  const targetUserId = userId || currentUser?.uid

  const fetchProfile = useCallback(async () => {
    if (!targetUserId) return

    try {
      setLoading(true)
      setError(null)

      // If viewing own profile, no auth token needed for basic info
      const headers: Record<string, string> = {}
      if (currentUser) {
        const userToken = await currentUser.getIdToken()
        headers['Authorization'] = `Bearer ${userToken}`
      }

      // Fetch user stats
      const statsResponse = await fetch(`/api/users/${targetUserId}/stats`, {
        headers
      })

      if (!statsResponse.ok) {
        if (statsResponse.status === 404) {
          throw new Error('User not found')
        }
        throw new Error('Failed to fetch user profile')
      }

      const statsData = await statsResponse.json()
      const isOwnProfile = currentUser?.uid === targetUserId

      let friendshipStatus: UserProfile['friendshipStatus'] = 'none'

      // If viewing another user's profile, check friendship status
      if (!isOwnProfile && currentUser) {
        try {
          const searchResponse = await fetch(`/api/friends/search?q=${encodeURIComponent(statsData.user.email)}`, {
            headers: {
              'Authorization': `Bearer ${await currentUser.getIdToken()}`
            }
          })

          if (searchResponse.ok) {
            const searchData = await searchResponse.json()
            const userResult: UserWithStatus | undefined = searchData.users?.find((u: UserWithStatus) => u.uid === targetUserId)
            if (userResult) friendshipStatus = userResult.relationshipStatus
          }
        } catch (err) {
          console.warn('Could not fetch friendship status:', err)
        }
      }

      setProfile({
        user: statsData.user,
        stats: statsData,
        isOwnProfile,
        friendshipStatus
      })
    } 
    catch (err: unknown) {
      if (!(err instanceof Error)) return;
      setError(err.message || 'Failed to load profile')
      console.error('Error fetching profile:', err)
    } 
    finally {
      setLoading(false)
    }
  }, [targetUserId, currentUser])

  useEffect(() => {
    if (!currentUser && !userLoading) {
      router.push('/login')
      return
    }

    if (!targetUserId) return

    fetchProfile()
  }, [currentUser, userLoading, targetUserId, router, fetchProfile])

  const handleSendFriendRequest = async () => {
    if (!profile || !currentUser || profile.isOwnProfile) return

    try {
      setSendingRequest(true)
      const userToken = await currentUser.getIdToken()

      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiverEmail: profile.user.email
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send friend request')
      }

      // Refresh profile to update friendship status
      fetchProfile()
    } 
    catch (error: unknown) {
      if (!(error instanceof Error)) return;
      console.error('Error sending friend request:', error);
      alert(error.message || 'Failed to send friend request');
    } 
    finally {
      setSendingRequest(false)
    }
  }

  const showFavTeams = () => {
    if (!profile?.stats) return 'N/A'
    const numberOfTeams = profile.stats.favoriteTeams.length || 0
    if (numberOfTeams === 0) return 'N/A'
    if (numberOfTeams === 1) return profile.stats.favoriteTeams[0].name
    if (numberOfTeams > 3) return `${numberOfTeams} teams`
    return profile.stats.favoriteTeams.map(team => team.name).join(', ')
  }

  const getJoinDate = () => {
    if (!profile?.user.createdAt) return 'Unknown'
    return new Date(profile.user.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getFriendshipButton = () => {
    if (!profile || profile.isOwnProfile || !currentUser) return null

    switch (profile.friendshipStatus) {
      case 'friend':
        return (
          <GradientButton
            onClick={() => router.push('/friends')}
            className="flex items-center space-x-2"
          >
            <span>✓</span>
            <span>Friends</span>
          </GradientButton>
        )
      case 'request_sent_pending':
        return (
          <GradientButton disabled className="opacity-60">
            Request Sent
          </GradientButton>
        )
      case 'request_received_pending':
        return (
          <GradientButton
            onClick={() => router.push('/friends?tab=requests')}
            className="flex items-center space-x-2"
          >
            <span>📨</span>
            <span>Respond to Request</span>
          </GradientButton>
        )
      case 'request_sent_accepted':
      case 'request_sent_blocked':
      case 'request_received_accepted':
      case 'request_received_blocked':
        return null
      default:
        return (
          <GradientButton
            onClick={handleSendFriendRequest}
            disabled={sendingRequest}
          >
            {sendingRequest ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sending...</span>
              </div>
            ) : (
              '+ Add Friend'
            )}
          </GradientButton>
        )
    }
  }

  if (userLoading || loading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 shadow-2xl backdrop-blur-sm">
          <FootballLoader />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center rounded-3xl border border-[var(--color-danger-soft-border)] bg-[var(--color-danger-soft-bg)] p-8 text-center shadow-2xl">
          <div>
            <div className="mb-4 text-6xl">😕</div>
            <h1 className="mb-2 text-2xl font-bold text-white">Profile Not Found</h1>
            <p className="mb-6 text-[var(--color-danger-soft-text)]">{error}</p>
          <GradientButton onClick={() => router.back()}>
            Go Back
          </GradientButton>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 p-5 shadow-2xl backdrop-blur-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4 sm:gap-6">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-highlight)] text-2xl font-black text-white shadow-lg sm:h-24 sm:w-24 sm:text-3xl">
                {profile.user.displayName.charAt(0).toUpperCase()}
              </div>

              <div>
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-highlight)]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Player Profile
                </p>
                <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">
                  {profile.user.displayName}
                </h1>
                <p className="mt-1 text-sm text-gray-300 sm:text-base">{profile.user.email}</p>
                <p className="mt-1 inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined {getJoinDate()}
                </p>
                {profile.isOwnProfile && (
                  <p className="mt-2 text-sm font-semibold text-[var(--color-accent)]">This is your profile</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {getFriendshipButton()}
              {profile.isOwnProfile && (
                <GradientButton
                  onClick={() => router.push('/add-save')}
                  className="flex items-center gap-2"
                >
                  <span>+</span>
                  <span>Add Save</span>
                </GradientButton>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/90 p-5 shadow-2xl backdrop-blur-sm sm:p-8">
          <h2 className="mb-6 text-2xl font-black text-white">
            📊 {profile.isOwnProfile ? 'Your' : `${profile.user.displayName}'s`} Career Statistics
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-darker)]/80 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-300">Active Saves</h3>
                  <p className="text-3xl font-bold text-[var(--color-accent)]">{profile.stats.activeSaves}</p>
                </div>
                <ShieldCheck className="h-9 w-9 text-[var(--color-accent)]" />
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-darker)]/80 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-300">Total Trophies</h3>
                  <p className="text-3xl font-bold text-[var(--color-highlight)]">{profile.stats.totalTrophies}</p>
                </div>
                <Trophy className="h-9 w-9 text-[var(--color-highlight)]" />
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-darker)]/80 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-300">Seasons Played</h3>
                  <p className="text-3xl font-bold text-[var(--color-success)]">{profile.stats.currentSeasons}</p>
                </div>
                <Calendar className="h-9 w-9 text-[var(--color-success)]" />
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-darker)]/80 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-300">Total Matches</h3>
                  <p className="text-3xl font-bold text-[var(--color-accent)]">{profile.stats.totalMatches}</p>
                </div>
                <Volleyball className="h-9 w-9 text-[var(--color-accent)]" />
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-darker)]/80 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-300">Favorite Teams</h3>
                  <p className="text-lg font-bold text-[var(--color-highlight)]">
                    {showFavTeams()}
                  </p>
                </div>
                <Users className="h-9 w-9 text-[var(--color-highlight)]" />
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-darker)]/80 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-300">Longest Save</h3>
                  <p className="text-lg font-bold text-[var(--color-success)]">
                    {profile.stats.longestSave?.currentClub?.name || 'N/A'} 
                    {profile.stats.longestSave?.seasons.length ? ` (${profile.stats.longestSave.seasons.length} seasons)` : ''}
                  </p>
                </div>
                <Crown className="h-9 w-9 text-[var(--color-success)]" />
              </div>
            </div>
          </div>

          {profile.isOwnProfile && profile.stats.activeSaves === 0 && (
            <div className="mt-8 rounded-2xl border border-[var(--color-accent)] bg-[var(--color-accent)]/15 p-6 text-center">
              <div className="mb-4 text-4xl">🚀</div>
              <h3 className="mb-2 text-xl font-bold text-white">Ready to Start Your Journey?</h3>
              <p className="mb-4 text-gray-300">You haven&apos;t created any saves yet. Start your Football Manager career!</p>
              <GradientButton onClick={() => router.push('/add-save')}>
                Create Your First Save
              </GradientButton>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}