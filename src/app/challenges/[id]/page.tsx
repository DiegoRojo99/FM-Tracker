"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CareerChallengeWithDetails, ChallengeWithGoals } from '@/lib/types/prisma/Challenge';
import FootballLoader from '../../components/FootBallLoader';
import { useAuth } from '../../components/AuthProvider';
import ProgressBar from '../../components/progress/ProgressBar';

export default function ChallengeDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<ChallengeWithGoals | null>(null);
  const [userChallenge, setUserChallenge] = useState<CareerChallengeWithDetails | null>(null);
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
        setUserChallenge(null);
        setLoading(false);
        return;
      }

      const data = await res.json();
      setChallenge(data.challenge);
      setUserChallenge(data.userChallenge || null);
      setLoading(false);
    }

    if (typeof params.id === 'string') {
      fetchChallenge(params.id);
    } else if (Array.isArray(params.id) && params.id.length > 0) {
      fetchChallenge(params.id[0]);
    }
  }, [params.id, user]);

  if (loading) {
    return <div className="p-6 mx-auto max-w-2xl"><FootballLoader /></div>;
  }
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
        {userChallenge && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Progress</span>
              {userChallenge.completedAt && (
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">✓ Completed</span>
              )}
            </div>
            <ProgressBar 
              completed={userChallenge.goalProgress.filter(gp => gp.isComplete).length} 
              total={userChallenge.goalProgress.length} 
              showText={true}
            />
          </div>
        )}
      </header>
      
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">Goals</h2>
        <ul className="space-y-3">
          {challenge.goals.map((goal) => {
            const isCompleted = userChallenge?.goalProgress.find(gp => gp.id === goal.id)?.isComplete;
            return (
              <li 
                key={goal.id} 
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  isCompleted 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                    : 'bg-gray-50 dark:bg-zinc-800/40 border border-gray-200 dark:border-zinc-700'
                }`}
              >
                <span className={`text-xl flex-shrink-0 ${isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                  {isCompleted ? '✓' : '○'}
                </span>
                <span className={`text-base flex-1 ${
                  isCompleted 
                    ? 'text-gray-700 dark:text-gray-200 line-through' 
                    : 'text-gray-700 dark:text-gray-200'
                }`}>
                  {goal.description}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
