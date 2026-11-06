import React, { useState } from 'react';
import Image from 'next/image';
import { TrophyGroup } from '@/lib/types/prisma/Trophy';
import { CountryWithCompetitions } from '@/lib/types/prisma/Competitions';

interface TrophyCountryProps {
  country: CountryWithCompetitions;
  trophies: TrophyGroup[];
}

function genderSortRank(isFemale: boolean | null | undefined): number {
  return isFemale === true ? 0 : 1;
}

function tierSortRank(tier: number | null | undefined): number {
  return typeof tier === 'number' ? tier : 999;
}

const TrophyCountry: React.FC<TrophyCountryProps> = ({ country, trophies }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasWon = (competitionId: number) => {    
    // Check if user has won this specific competition
    const directWin = trophies.some((t) => t.competitionGroup.id === competitionId);
    if (directWin) return true;    
    return false;
  };
  
  const comps = (country.competitions || []).slice().sort((a, b) => {
    const genderCompare = genderSortRank(a.isFemale) - genderSortRank(b.isFemale);
    if (genderCompare !== 0) return genderCompare;

    const tierCompare = tierSortRank(a.tier) - tierSortRank(b.tier);
    if (tierCompare !== 0) return tierCompare;

    return a.name.localeCompare(b.name);
  });
  const total = comps.length;
  const won = comps.filter((c) => hasWon(c.id)).length;
  const completionPercentage = total > 0 ? Math.round((won / total) * 100) : 0;

  const completionClass =
    completionPercentage === 100
      ? 'border-[var(--color-success)]/60 bg-[var(--color-success)]/10 text-[var(--color-success)]'
      : completionPercentage >= 50
      ? 'border-[var(--color-accent)]/60 bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
      : 'border-[var(--color-surface-border)] bg-[var(--color-surface-soft)] text-[var(--color-text-muted)]';

  return (
    <div className="fm-panel h-fit overflow-hidden transition-colors hover:border-[var(--color-accent)]/60">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={`trophy-country-${country.code}`}
        className="flex min-h-11 w-full items-center justify-between gap-3 p-3 text-left transition-colors hover:bg-[var(--color-surface-soft)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--color-accent)]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <Image
            src={country.flag} 
            alt={country.name} 
            width={32}
            height={32}
            className="h-8 w-8 rounded shadow-sm"
            unoptimized
          />
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-[var(--color-foreground)]">{country.name}</h3>
            <p className="truncate text-xs text-[var(--color-text-muted)]">
              {won} of {total} competitions
            </p>
          </div>
        </div>
        
        <div className="flex shrink-0 items-center gap-2">
          <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${completionClass}`}>
            {completionPercentage}%
          </div>
          
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)]">
            <svg 
              className={`h-4 w-4 text-[var(--color-text-muted)] transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </button>

      {isExpanded && (
        <div id={`trophy-country-${country.code}`} className="border-t border-[var(--color-surface-border)] bg-[var(--color-darker)]">
          <ul className="divide-y divide-[var(--color-surface-border)]">
            {comps.map((comp, index) => {
              const won = hasWon(comp.id);
              return (
                <li
                  key={`${country.code}-${String(comp.id)}-${index}`}
                  className={`p-3 flex items-center gap-3 transition-colors ${
                    won 
                      ? 'bg-emerald-500/10' 
                      : 'hover:bg-[var(--color-surface-soft)]'
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
                  ) : <div className="h-5 w-5 flex-shrink-0 rounded bg-[var(--color-surface-strong)]" />}
                  <span className={`min-w-0 flex-1 break-words text-sm ${
                    won 
                      ? 'font-medium text-emerald-700 dark:text-emerald-300' 
                      : 'text-[var(--color-text-muted)]'
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
