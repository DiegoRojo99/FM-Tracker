'use client'

import { User } from 'firebase/auth'
import { useCallback, useEffect, useMemo, useState } from 'react'
import FootballLoader from '@/app/components/FootBallLoader'
import { GradientButton } from '@/app/components/GradientButton'
import { useRouter } from 'next/navigation'

type LeaderboardEntry = {
  userId: string
  displayName: string
  email: string
  avatarURL: string | null
  score: number
  rank: number
  stats: {
    totalTrophies: number
    promotions: number
  }
  breakdown: {
    trophiesPoints: number
    promotionsPoints: number
  }
}

type LeaderboardResponse = {
  leaderboard: LeaderboardEntry[]
  participantCount: number
  gameId: string | null
  games: Array<{ id: string; name: string }>
}

interface FriendsLeaderboardProps {
  user: User
}

export default function FriendsLeaderboard({ user }: FriendsLeaderboardProps) {
  const router = useRouter()
  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedGame, setSelectedGame] = useState<string>('')

  const fetchLeaderboard = useCallback(async (gameId: string) => {
    try {
      setLoading(true)
      setError(null)

      const userToken = await user.getIdToken()
      const query = gameId ? `?gameId=${encodeURIComponent(gameId)}` : ''

      const response = await fetch(`/api/friends/leaderboard${query}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      })

      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      const result: LeaderboardResponse = await response.json();
      setData(result);
    } 
    catch (err) {
      console.error('Error fetching leaderboard:', err)
      setError('Failed to load leaderboard data')
    } 
    finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchLeaderboard(selectedGame)
  }, [fetchLeaderboard, selectedGame])

  const currentUserId = user.uid
  const myEntry = useMemo(
    () => data?.leaderboard.find((entry) => entry.userId === currentUserId),
    [data, currentUserId]
  )

  const renderRankMedal = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  if (loading) {
    return (
      <div className="py-12">
        <FootballLoader />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-200 text-center">
        {error}
        <button
          onClick={() => fetchLeaderboard(selectedGame)}
          className="ml-4 underline hover:no-underline"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!data || data.leaderboard.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏁</div>
        <h3 className="text-xl font-semibold text-white mb-2">No ranking data yet</h3>
        <p className="text-gray-300">Add saves and trophies to start climbing the leaderboard.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">🏆 Friends Leaderboard</h2>
          <p className="text-sm text-gray-300">
            Ranking {data.participantCount} players by real achievements: trophies and promotions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="leaderboard-game" className="text-sm text-gray-300">Game</label>
          <select
            id="leaderboard-game"
            value={selectedGame}
            onChange={(event) => setSelectedGame(event.target.value)}
            className="bg-[var(--color-darker)] text-white border border-gray-600 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Games</option>
            {data.games.map((game) => (
              <option key={game.id} value={game.id}>{game.name}</option>
            ))}
          </select>
        </div>
      </div>

      {myEntry && (
        <div className="bg-[var(--color-darker)] border border-[var(--color-accent)] rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-300">Your position</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-white font-semibold text-lg">
              {renderRankMedal(myEntry.rank)} {myEntry.displayName}
            </p>
            <p className="text-[var(--color-accent)] font-bold text-xl">{myEntry.score.toLocaleString()} pts</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {data.leaderboard.map((entry) => (
          <div
            key={entry.userId}
            className={`rounded-lg p-4 border ${entry.userId === currentUserId ? 'bg-[var(--color-darker)] border-[var(--color-accent)]' : 'bg-[var(--color-darker)]/70 border-transparent'}`}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="text-lg font-bold text-white w-12 shrink-0">{renderRankMedal(entry.rank)}</div>
                <div className="w-10 h-10 bg-[var(--color-accent)] rounded-full flex items-center justify-center text-white font-bold">
                  {entry.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-semibold truncate">{entry.displayName}</p>
                  <p className="text-xs text-gray-400 truncate">{entry.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 md:gap-6">
                <div className="text-right">
                  <p className="text-[var(--color-accent)] font-bold text-xl">{entry.score.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">points</p>
                </div>
                <GradientButton
                  size="sm"
                  onClick={() => router.push(`/profile/${entry.userId}`)}
                >
                  View Profile
                </GradientButton>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
              <div className="bg-black/20 rounded-md p-2 text-gray-300">🏆 {entry.stats.totalTrophies} ({entry.breakdown.trophiesPoints} pts)</div>
              <div className="bg-black/20 rounded-md p-2 text-gray-300">📈 {entry.stats.promotions} ({entry.breakdown.promotionsPoints} pts)</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
