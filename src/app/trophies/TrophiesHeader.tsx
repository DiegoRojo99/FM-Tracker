import React from 'react';
import { Game } from '@/lib/types/Game';

interface TrophiesHeaderProps {
  games: Game[];
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
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <div className="text-sm font-medium text-blue-900 dark:text-blue-300">Trophies Won</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{totalTrophies}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
          <div className="text-sm font-medium text-purple-900 dark:text-purple-300">Total Competitions</div>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">{totalCompetitions}</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
          <div className="text-sm font-medium text-green-900 dark:text-green-300">Completion</div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{completionPercentage}%</div>
        </div>
      </div>
    </div>
  );
};

export default TrophiesHeader;
