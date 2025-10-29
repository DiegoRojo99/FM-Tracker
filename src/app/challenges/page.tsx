'use client';
import { useEffect, useState } from "react";
import { CareerChallenge, Challenge, ChallengeGoal } from "@/lib/types/Challenge";
import FootballLoader from "../components/FootBallLoader";
import BlurredCard from "../components/BlurredCard";
import ProgressBar from "../components/progress/ProgressBar";
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
        {sectionOrder.map(section => (
          challengeGroups[section.key].length > 0 && (
            <div key={section.key}>
              <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-gray-800 dark:text-gray-100">
                <span role="img" aria-label={section.label}>{section.icon}</span> {section.label}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {challengeGroups[section.key].map(({ challenge, userChallenge }) => (
                  <CollapsibleChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    userChallenge={userChallenge}
                    status={user ? section.key : undefined}
                  />
                ))}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}



import { useState as useLocalState } from 'react';

type CollapsibleChallengeCardProps = {
  challenge: Challenge;
  userChallenge?: CareerChallenge;
  status?: 'completed' | 'in-progress' | 'not-started';
};

const statusStyles = {
  completed: 'border-green-500 bg-green-50 dark:bg-green-900/40',
  'in-progress': 'border-blue-400 bg-blue-50 dark:bg-blue-900/40',
  'not-started': 'border-gray-300 bg-gray-50 dark:bg-zinc-800/40',
};

const statusBadge = {
  completed: (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500 text-white" aria-label="Completed">
      <span role="img" aria-label="trophy">🏆</span> Completed
    </span>
  ),
  'in-progress': (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500 text-white" aria-label="In Progress">
      <span role="img" aria-label="hourglass">⏳</span> In Progress
    </span>
  ),
  'not-started': (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-400 text-white" aria-label="Not Started">
      <span role="img" aria-label="lock">🔒</span> Not Started
    </span>
  ),
};

const CollapsibleChallengeCard: React.FC<CollapsibleChallengeCardProps> = ({ challenge, userChallenge, status }) => {
  const [open, setOpen] = useLocalState(false);
  const cardStyle = status ? statusStyles[status] : statusStyles['not-started'];
  return (
    <BlurredCard className={`h-full border-2 ${cardStyle} flex flex-col justify-between transition-all duration-300 cursor-pointer`}>
      <div onClick={() => setOpen(o => !o)} className="flex items-center justify-between gap-2 select-none">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex-1">{challenge.name}</h3>
        {status && statusBadge[status]}
        <span className="ml-2 text-gray-500 dark:text-gray-300 text-xl">{open ? '▼' : '▶'}</span>
      </div>
      {open && (
        <div className="flex flex-col gap-2 mt-2">
          <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">{challenge.description}</p>
          {challenge.bonus && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Bonus: {challenge.bonus}</p>
          )}
          {userChallenge && (
            <div className="mb-2">
              <ProgressBar completed={userChallenge.completedGoals.length} total={userChallenge.goals.length} showText={false} />
            </div>
          )}
          <div className="flex flex-col gap-1 mt-2">
            {challenge.goals.map((goal) => {
              const isCompleted = !!userChallenge && userChallenge.completedGoals.includes(goal.id);
              return (
                <div key={goal.id} className="flex items-center gap-2 text-sm">
                  <span className={`flex-1 ${isCompleted ? 'line-through text-green-600 dark:text-green-400' : ''}`}>{goal.description}</span>
                  {userChallenge && (
                    <span className="text-xs" aria-label={isCompleted ? 'Completed' : 'Incomplete'}>
                      {isCompleted ? '✓' : ''}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </BlurredCard>
  );
};




