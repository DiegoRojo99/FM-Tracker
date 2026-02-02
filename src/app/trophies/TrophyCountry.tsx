import React, { useState } from 'react';
import Image from 'next/image';
import { TrophyGroup } from '@/lib/types/prisma/Trophy';
import { CountryWithCompetitions } from '@/lib/types/prisma/Competitions';

interface TrophyCountryProps {
  country: CountryWithCompetitions;
  trophies: TrophyGroup[];
}

const TrophyCountry: React.FC<TrophyCountryProps> = ({ country, trophies }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasWon = (competitionId: number) => {    
    // Check if user has won this specific competition
    const directWin = trophies.some((t) => t.competitionGroup.id === competitionId);
    if (directWin) return true;    
    return false;
  };
  
  const comps = country.competitions || [];
  const total = comps.length;
  const won = comps.filter((c) => hasWon(c.id)).length;
  const completionPercentage = total > 0 ? Math.round((won / total) * 100) : 0;

  return (
    <div className="bg-zinc-800 dark:bg-zinc-900 rounded-xl border border-zinc-700 dark:border-zinc-700 overflow-hidden hover:shadow-xl hover:shadow-zinc-900/50 hover:border-zinc-600 dark:hover:border-zinc-600 transition-all duration-200 h-fit">
      {/* Country Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-zinc-700 dark:hover:bg-zinc-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Image
            src={country.flag} 
            alt={country.name} 
            width={32}
            height={32}
            className="w-8 h-8 rounded shadow-sm"
            unoptimized
          />
          <div className="text-left">
            <h3 className="font-semibold text-white">{country.name}</h3>
            <p className="text-xs text-gray-400">
              {won} of {total} competitions
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Progress Badge */}
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
            completionPercentage === 100 
              ? 'bg-green-900/40 text-green-400'
              : completionPercentage >= 50
              ? 'bg-blue-900/40 text-blue-400'
              : 'bg-zinc-800 text-gray-400'
          }`}>
            {completionPercentage}%
          </div>
          
          {/* Expand Icon */}
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 cursor-pointer ${isExpanded ? 'rotate-90' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      {/* Competitions List */}
      {isExpanded && (
        <div className="border-t border-zinc-700 dark:border-zinc-800 bg-zinc-800/50 dark:bg-zinc-900/50">
          <ul className="divide-y divide-zinc-200/30 dark:divide-zinc-300/50">
            {comps.map((comp, index) => {
              const won = hasWon(comp.id);
              return (
                <li
                  key={`${country.code}-${String(comp.id)}-${index}`}
                  className={`p-3 flex items-center gap-3 transition-colors ${
                    won 
                      ? 'bg-green-900/20' 
                      : 'hover:bg-zinc-800/50'
                  }`}
                >
                  {comp.logoUrl ? (
                    <Image 
                      src={comp.logoUrl} 
                      alt={comp.name} 
                      width={20}
                      height={20}
                      className="w-5 h-5 flex-shrink-0"
                      unoptimized
                    />
                  ) : (
                    <div className="w-5 h-5 bg-zinc-700 rounded flex-shrink-0"></div>
                  )}
                  <span className={`flex-1 text-sm ${
                    won 
                      ? 'text-green-400 font-medium' 
                      : 'text-gray-300'
                  }`}>
                    {comp.name}
                  </span>
                  {won && (
                    <span className="text-lg">🏆</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TrophyCountry;
