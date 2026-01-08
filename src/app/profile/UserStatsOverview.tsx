import { useEffect, useState } from 'react';
import { useAuth } from '@/app/components/AuthProvider';
import { useRouter } from 'next/navigation';

interface UserStats {
  activeSaves: number;
  totalTrophies: number;
  totalMatches: number;
  currentSeasons: number;
  favoriteTeam?: string;
  longestSave?: string;
}

export default function UserStatsOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const fetchStats = async () => {
      try {
        setLoading(true);
        const userToken = await user.getIdToken();
        const response = await fetch('/api/users/stats', {
          headers: {
            'Authorization': `Bearer ${userToken}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const statsData = await response.json();
        setStats(statsData);
      } catch (err) {
        setError('Failed to load profile statistics');
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  // Always reserve the same space for the stats section
  return (
    <div className="w-full max-w-4xl mx-auto min-h-64 space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">📊 Your Career Statistics</h2>
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]"></div>
          <p className="text-gray-300 mt-4">Loading your stats...</p>
        </div>
      )}
      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-200 text-center">
          {error}
        </div>
      )}
      {stats && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-[var(--color-darker)] rounded-lg p-6 border-2 border-[var(--color-primary)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-300">Active Saves</h3>
                <p className="text-3xl font-bold text-[var(--color-accent)]">{stats.activeSaves}</p>
              </div>
              <div className="text-4xl">💾</div>
            </div>
          </div>
          <div className="bg-[var(--color-darker)] rounded-lg p-6 border-2 border-[var(--color-primary)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-300">Total Trophies</h3>
                <p className="text-3xl font-bold text-[var(--color-highlight)]">{stats.totalTrophies}</p>
              </div>
              <div className="text-4xl">🏆</div>
            </div>
          </div>
          <div className="bg-[var(--color-darker)] rounded-lg p-6 border-2 border-[var(--color-primary)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-300">Seasons Played</h3>
                <p className="text-3xl font-bold text-[var(--color-success)]">{stats.currentSeasons}</p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
          </div>
          <div className="bg-[var(--color-darker)] rounded-lg p-6 border-2 border-[var(--color-primary)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-300">Total Matches</h3>
                <p className="text-3xl font-bold text-[var(--color-accent)]">{stats.totalMatches}</p>
              </div>
              <div className="text-4xl">⚽</div>
            </div>
          </div>
          <div className="bg-[var(--color-darker)] rounded-lg p-6 border-2 border-[var(--color-primary)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-300">Favorite Team</h3>
                <p className="text-xl font-bold text-[var(--color-highlight)]">
                  {stats.favoriteTeam || 'None yet'}
                </p>
              </div>
              <div className="text-4xl">❤️</div>
            </div>
          </div>
          <div className="bg-[var(--color-darker)] rounded-lg p-6 border-2 border-[var(--color-primary)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-300">Longest Save</h3>
                <p className="text-xl font-bold text-[var(--color-success)]">
                  {stats.longestSave || 'None yet'}
                </p>
              </div>
              <div className="text-4xl">🎖️</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}