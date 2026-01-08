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
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
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

  if (!user) return null;

  return (
    <div className="space-y-6">
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
      {stats && stats.activeSaves === 0 && !loading && (
        <div className="bg-[var(--color-accent)]/20 border border-[var(--color-accent)] rounded-lg p-6 text-center">
          <div className="text-4xl mb-4">🚀</div>
          <h3 className="text-xl font-bold text-white mb-2">Ready to Start Your Journey?</h3>
          <p className="text-gray-300 mb-4">You haven&apos;t created any saves yet. Start your Football Manager career!</p>
          <button
            onClick={() => router.push('/add-save')}
            className="bg-[var(--color-accent)] text-white px-6 py-3 rounded-lg hover:bg-[var(--color-highlight)] transition-all duration-200 font-medium"
          >
            Create Your First Save
          </button>
        </div>
      )}
    </div>
  );
}