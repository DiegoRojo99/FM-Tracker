"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CareerChallengeWithSaveDetails, ChallengeGoalWithDetails, ChallengeWithGoals } from '@/lib/types/prisma/Challenge';
import FootballLoader from '../../components/FootBallLoader';
import ProgressBar from '../../components/progress/ProgressBar';
import { useAuth } from '../../components/AuthProvider';
import ChallengeGoalCard from "./ChallengeGoalCard";

export default function ChallengeDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<ChallengeWithGoals | null>(null);
  const [userChallenges, setUserChallenges] = useState<CareerChallengeWithSaveDetails[]>([]);
  const [selectedSaveIndex, setSelectedSaveIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChallenge(challengeKey: string) {
      const headers: HeadersInit = {};
      
      // Add auth token if user is logged in
      if (user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(`/api/challenges/${encodeURIComponent(challengeKey)}`, { headers });
      if (!res.ok) {
        setChallenge(null);
        setUserChallenges([]);
        setLoading(false);
        return;
      }

      const data = await res.json();
      setChallenge(data.challenge);
      setUserChallenges(data.userChallenges || []);
      setSelectedSaveIndex(0); // Reset to first save when data changes
      setLoading(false);
    }

    if (typeof params.id === 'string') { fetchChallenge(params.id); }
    else if (Array.isArray(params.id) && params.id.length > 0) { fetchChallenge(params.id[0]); }
  }, [params.id, user]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
        <div className="flex min-h-[50vh] items-center justify-center rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/88 shadow-xl backdrop-blur-sm">
          <FootballLoader />
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
        <div className="rounded-3xl border border-[var(--color-danger-soft-border)] bg-[var(--color-danger-soft-bg)] px-5 py-4 text-[var(--color-danger-soft-text)] shadow-lg">
          Challenge not found.
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      <header className="relative overflow-hidden rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/92 p-5 shadow-2xl backdrop-blur-sm sm:p-8">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-[8%] top-[-2rem] h-36 w-36 rounded-full bg-[var(--color-highlight)]/15 blur-3xl" />
          <div className="absolute right-[10%] top-[8%] h-40 w-40 rounded-full bg-[var(--color-accent)]/20 blur-3xl" />
        </div>

        <h1 className="text-3xl font-black text-white sm:text-4xl">{challenge.name}</h1>
        <p className="mt-2 text-base text-[var(--color-text-muted)] sm:text-lg">{challenge.description}</p>
        {challenge.bonus && (
          <div className="mt-4 inline-flex items-center rounded-lg border border-amber-300/40 bg-amber-400/15 px-3 py-1 text-sm font-semibold text-amber-100">
            Bonus: {challenge.bonus}
          </div>
        )}
        
        {/* Display user progress if logged in */}
        {userChallenges.length > 0 && (() => {
          const selectedChallenge = userChallenges[selectedSaveIndex];
          return (
            <div className="mt-6 rounded-2xl border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)]/70 p-4">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-bold text-white">Your Progress</h3>
                {userChallenges.length > 1 && (
                  <select 
                    value={selectedSaveIndex} 
                    onChange={(e) => setSelectedSaveIndex(Number(e.target.value))}
                    className="rounded-md border border-[var(--color-surface-border)] bg-[var(--color-dark)] px-3 py-1.5 text-sm text-white focus:border-[var(--color-highlight)] focus:outline-none"
                  >
                    {userChallenges.map((challenge, index) => (
                      <option key={challenge.id} value={index}>
                        {challenge.save ? `${challenge.save.season} Season` : 'Legacy Save'}
                        {challenge.completedAt ? ' (Completed)' : ' (In Progress)'}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              {selectedChallenge && (
                <div className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/65 p-4">
                  <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="text-sm font-semibold text-white">
                        {selectedChallenge.save ? (
                          `Save: ${selectedChallenge.save.season} Season`
                        ) : (
                          'Legacy Save'
                        )}
                      </span>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Started: {new Date(selectedChallenge.startedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {selectedChallenge.completedAt && (
                      <span className="text-sm font-semibold text-emerald-300">
                        ✓ Completed {new Date(selectedChallenge.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <ProgressBar 
                    completed={selectedChallenge.goalProgress.filter(gp => gp.isComplete).length} 
                    total={selectedChallenge.goalProgress.length} 
                    showText={true}
                  />
                </div>
              )}
            </div>
          );
        })()}
      </header>
      
      <section className="mt-6 overflow-hidden rounded-3xl border border-[var(--color-surface-border)] bg-[var(--color-dark)]/88 p-4 shadow-xl backdrop-blur-sm sm:p-6">
        <h2 className="mb-3 text-xl font-bold text-white">Goals</h2>
        <div className="space-y-3">
          {challenge.goals.map((goal: ChallengeGoalWithDetails) => 
            <ChallengeGoalCard 
              key={goal.id} 
              goal={goal} 
              selectedUserChallenge={userChallenges.length > 0 ? userChallenges[selectedSaveIndex] : null} 
            />
          )}
        </div>
      </section>
    </main>
  );
}
