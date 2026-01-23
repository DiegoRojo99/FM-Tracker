import React from 'react';
import { FirebaseGame } from '@/lib/types/firebase/Game';

interface TrophiesHeaderProps {
  games: FirebaseGame[];
  selectedGame: string;
  onGameChange: (game: string) => void;
  totalTrophies?: number;
  totalCompetitions?: number;
}

const TrophiesHeader: React.FC<TrophiesHeaderProps> = ({ 
  games, 
  selectedGame, 
  onGameChange,
  totalTrophies = 0,
  totalCompetitions = 0
}) => {
  const completionPercentage = totalCompetitions > 0 
    ? Math.round((totalTrophies / totalCompetitions) * 100) 
    : 0;

  return (
    <div className="space-y-6 pb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
            <span className="text-4xl">🏆</span>
            <span>Trophy Cabinet</span>
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Track your competition victories across the world
          </p>
        </div>
        
        {games.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="game-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Game:
            </label>
            <select
              id="game-select"
              value={selectedGame}
              onChange={(e) => onGameChange(e.target.value)}
              className="border border-gray-300 dark:border-zinc-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            >
              <option value="all">All Games</option>
              {games.map(game => (
                <option key={game.id} value={game.id}>{game.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl p-4 bg-blue-100 dark:bg-blue-900/50 border border-blue-300 dark:border-blue-700">
          <div className="text-sm font-medium text-black">Trophies Won</div>
          <div className="text-3xl font-bold text-black mt-1">{totalTrophies}</div>
        </div>
        <div className="rounded-xl p-4 bg-purple-100 dark:bg-purple-900/50 border border-purple-300 dark:border-purple-700">
          <div className="text-sm font-medium text-black">Total Competitions</div>
          <div className="text-3xl font-bold text-black mt-1">{totalCompetitions}</div>
        </div>
        <div className="rounded-xl p-4 bg-green-100 dark:bg-green-900/50 border border-green-300 dark:border-green-700">
          <div className="text-sm font-medium text-black">Completion</div>
          <div className="text-3xl font-bold text-black mt-1">{completionPercentage}%</div>
        </div>
      </div>
    </div>
  );
};

export default TrophiesHeader;
