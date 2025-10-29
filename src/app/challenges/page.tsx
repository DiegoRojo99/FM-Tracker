'use client';
import ChallengeSection from './ChallengeSection';
import { useEffect, useState } from "react";
import { CareerChallenge, Challenge } from "@/lib/types/Challenge";
import FootballLoader from "../components/FootBallLoader";
import { useAuth } from "../components/AuthProvider";

export default function ChallengesPage() {
  const { user, userLoading } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<CareerChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<string>('');

  // Compute unique games from userChallenges
  const gameOptions = Array.from(new Set(userChallenges.map(uc => uc.gameId).filter(Boolean)));
  
  useEffect(() => {
    async function fetchAll() {
      if (!user) return;
      const token = await user.getIdToken();
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [allChallengesRes, userChallengesRes] = await Promise.all([
        fetch('/api/challenges', { headers }),
        fetch('/api/challenges/user', { headers }),
      ]);

      const allChallengesData = await allChallengesRes.json();
      const userChallengesData = await userChallengesRes.json();

      setChallenges(allChallengesData);
      setUserChallenges(userChallengesData);
      setLoading(false);
    }
    // Wait for user to be loaded
    if (userLoading) return;
    else if (!user) {
      setLoading(false);
      return;
    }
    else {
      fetchAll();
    }

  }, [user, userLoading]);

  // Filter userChallenges by selected game
  const filteredUserChallenges = selectedGame
    ? userChallenges.filter(uc => uc.gameId === selectedGame)
    : userChallenges;

  if (loading) return <FootballLoader />;

  // Group challenges by status
  const challengeGroups = {
    'in-progress': [] as { challenge: Challenge; userChallenge?: CareerChallenge }[],
    'not-started': [] as { challenge: Challenge; userChallenge?: CareerChallenge }[],
    'completed': [] as { challenge: Challenge; userChallenge?: CareerChallenge }[],
  };

  challenges.forEach(challenge => {
    const userChallenge = filteredUserChallenges.find(uc => uc.id === challenge.id);
    let status: 'completed' | 'in-progress' | 'not-started' = 'not-started';
    if (userChallenge) {
      if (userChallenge.completedAt) status = 'completed';
      else if (userChallenge.completedGoals.length > 0) status = 'in-progress';
    }
    challengeGroups[status].push({ challenge, userChallenge });
  });

  // Section order: in-progress, not-started, completed
  const sectionOrder: Array<{ key: 'in-progress' | 'not-started' | 'completed', label: string, icon: string }> = [
    { key: 'in-progress', label: 'In Progress', icon: '⏳' },
    { key: 'not-started', label: 'Not Started', icon: '🔒' },
    { key: 'completed', label: 'Completed', icon: '🏆' },
  ];

  return (
    <div className="p-4 sm:p-6 mx-auto max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
          <span role="img" aria-label="trophy">🏆</span> Challenges
        </h1>
        {gameOptions.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="game-select" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Game:
            </label>
            <select
              id="game-select"
              value={selectedGame}
              onChange={e => setSelectedGame(e.target.value)}
              className="border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-1 text-sm bg-white dark:bg-zinc-900 text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Games</option>
              {gameOptions.map(game => (
                <option key={game} value={game}>{game}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="space-y-10">
          {sectionOrder.map(section => {
            const sectionChallenges = challengeGroups[section.key].map(({ challenge }) => ({
              challenge,
              status: user ? section.key : undefined,
            }));
            return (
              <ChallengeSection
                key={section.key}
                name={section.label}
                icon={section.icon}
                challenges={sectionChallenges}
              />
            );
          })}
      </div>
    </div>
  );
}




// MiniChallengeCard component removed as it is no longer used




