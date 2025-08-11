'use client';

import FootballLoader from '@/app/components/FootBallLoader';
import { useEffect, useState } from 'react';

interface Stats {
  totalUsers: number;
  totalSaves: number;
  totalTrophies: number;
  totalSeasons: number;
  totalCareerStints: number;
  totalChallenges: number;
  timestamp: string;
}

export default function AdminStatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const boxClass = 'bg-[var(--surface)] rounded-xl p-6 shadow hover:shadow-lg transition-shadow duration-200 text-center';
  const boxNumClass = 'text-2xl font-bold text-[var(--text)] mb-1';
  const boxLabelClass = 'text-sm text-[var(--text-muted)]';
  
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] font-sans py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">FM Tracker Admin Stats</h1>
        {loading ? (
          <FootballLoader />
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className={boxClass}>
              <div className={boxNumClass}>{stats.totalUsers.toLocaleString()}</div>
              <div className={boxLabelClass}>Users</div>
            </div>
            <div className={boxClass}>
              <div className={boxNumClass}>{stats.totalSaves.toLocaleString()}</div>
              <div className={boxLabelClass}>Saves</div>
            </div>
            <div className={boxClass}>
              <div className={boxNumClass}>{stats.totalTrophies.toLocaleString()}</div>
              <div className={boxLabelClass}>Trophies</div>
            </div>
            <div className={boxClass}>
              <div className={boxNumClass}>{stats.totalSeasons.toLocaleString()}</div>
              <div className={boxLabelClass}>Seasons</div>
            </div>
            <div className={boxClass}>
              <div className={boxNumClass}>{stats.totalCareerStints.toLocaleString()}</div>
              <div className={boxLabelClass}>Career Moves</div>
            </div>
            <div className={boxClass}>
              <div className={boxNumClass}>{stats.totalChallenges.toLocaleString()}</div>
              <div className={boxLabelClass}>Challenges</div>
            </div>
          </div>
        ) : (
          <div className="text-center text-[var(--text-muted)]">
            Unable to load stats at this time.
          </div>
        )}
        {stats && (
          <p className="mt-8 text-xs text-center text-[var(--text-muted)]">Last updated: {new Date(stats.timestamp).toLocaleString()}</p>
        )}
      </div>
    </div>
  );
}
