"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Challenge } from '@/lib/types/Challenge';
import FootballLoader from '../../components/FootBallLoader';

export default function ChallengeDetailPage() {
  const params = useParams();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChallenge(id: string) {
      const res = await fetch(`/api/challenges/${id}`);
      if (!res.ok) {
        setChallenge(null);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setChallenge(data);
      setLoading(false);
    }

    if (typeof params.id === 'string') {
      fetchChallenge(params.id);
    } else if (Array.isArray(params.id) && params.id.length > 0) {
      fetchChallenge(params.id[0]);
    }
  }, [params.id]);

  if (loading) {
    return <div className="p-6 mx-auto max-w-2xl"><FootballLoader /></div>;
  }
  if (!challenge) return <div className="p-6 mx-auto max-w-2xl text-red-600">Challenge not found.</div>;

  return (
    <main className="p-6 mx-auto">
      <header className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">{challenge.name}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">{challenge.description}</p>
        {challenge.bonus && (
          <div className="inline-block bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded font-semibold text-sm mb-2">
            Bonus: {challenge.bonus}
          </div>
        )}
      </header>
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-100">Goals</h2>
        <ul className="list-disc pl-6 space-y-2">
          {challenge.goals.map((goal: any) => (
            <li key={goal.id} className="text-base text-gray-700 dark:text-gray-200">{goal.description}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
