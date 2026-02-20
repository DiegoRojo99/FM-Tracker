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
    async function fetchChallenge(id: string) {
      const headers: HeadersInit = {};
      
      // Add auth token if user is logged in
      if (user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(`/api/challenges/${id}`, { headers });
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

  if (loading) return <div className="p-6 mx-auto max-w-2xl"><FootballLoader /></div>;
  if (!challenge) return <div className="p-6 mx-auto max-w-2xl text-red-600">Challenge not found.</div>;

  return (
    <main className="p-6 mx-auto max-w-4xl">
      <header className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">{challenge.name}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">{challenge.description}</p>
        {challenge.bonus && (
          <div className="inline-block bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded font-semibold text-sm mb-2">
            Bonus: {challenge.bonus}
          </div>
        )}
        
        {/* Display user progress if logged in */}
        {userChallenges.length > 0 && (() => {
          const selectedChallenge = userChallenges[selectedSaveIndex];
          return (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Your Progress</h3>
                {userChallenges.length > 1 && (
                  <select 
                    value={selectedSaveIndex} 
                    onChange={(e) => setSelectedSaveIndex(Number(e.target.value))}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {selectedChallenge.save ? (
                          `Save: ${selectedChallenge.save.season} Season`
                        ) : (
                          'Legacy Save'
                        )}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Started: {new Date(selectedChallenge.startedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {selectedChallenge.completedAt && (
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
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
      
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">Goals</h2>
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
