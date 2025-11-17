import React from 'react';
import { Game } from '@/lib/types/Game';

interface TrophiesHeaderProps {
  games: Game[];
  selectedGame: string;
  onGameChange: (game: string) => void;
}

const TrophiesHeader: React.FC<TrophiesHeaderProps> = ({ games, selectedGame, onGameChange }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h1 className="text-2xl font-bold">🏆 Trophies Checklist</h1>
      
      {games.length > 0 && (
        <div className="flex items-center gap-2">
          <label htmlFor="game-select" className="text-sm font-medium text-gray-700">
            Game:
          </label>
          <select
            id="game-select"
            value={selectedGame}
            onChange={(e) => onGameChange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm bg-white text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Games</option>
            {games.map(game => (
              <option key={game.id} value={game.id}>{game.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default TrophiesHeader;
