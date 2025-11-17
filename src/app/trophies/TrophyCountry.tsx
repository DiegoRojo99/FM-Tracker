import React from 'react';
import Image from 'next/image';
import BlurredCard from '../components/BlurredCard';
import CircleProgress from '@/app/components/progress/CircleProgress';
import { CountryWithCompetitions } from '@/lib/types/Country&Competition';
import { TrophyGroup } from '@/lib/types/Trophy';

interface TrophyCountryProps {
  country: CountryWithCompetitions;
  trophies: TrophyGroup[];
  groupMapping: Record<string, string[]>;
}

const TrophyCountry: React.FC<TrophyCountryProps> = ({ country, trophies, groupMapping }) => {
  const hasWon = (competitionId: string | number) => {
    const compIdStr = String(competitionId);
    
    // Check if user has won this specific competition
    const directWin = trophies.some((t) => String(t.competitionId) === compIdStr);
    if (directWin) return true;
    
    // Check if this is a grouped competition and user won any member of the group
    const groupName = Object.keys(groupMapping).find(groupName => 
      groupMapping[groupName].includes(compIdStr)
    );
    
    if (groupName) {
      // Check if user won any competition in this group
      const groupMembers = groupMapping[groupName];
      return trophies.some((t) => groupMembers.includes(String(t.competitionId)));
    }
    
    return false;
  };
  
  const comps = country.competitions || [];
  const total = comps.length;
  const won = comps.filter((c) => hasWon(c.id)).length;

  return (
    <BlurredCard className="h-fit">
      <div className="text-white p-2">
        <details className="space-y-2">
          <summary className="cursor-pointer flex items-center justify-between mb-0">
            <div className="flex items-center gap-2">
              <Image
                src={country.flag} 
                alt={country.name} 
                width={20}
                height={20}
                className="w-5 h-5"
                unoptimized
              />
              <span className="font-semibold text-lg">{country.name}</span>
            </div>
            <CircleProgress completed={won} total={total} size={48} strokeWidth={6} />
          </summary>

          <ul className="pl-4 space-y-1 pt-4">
            {comps.map((comp, index) => (
              <li
                key={`${country.code}-${String(comp.id)}-${index}`}
                className={`flex items-center gap-2 ${
                  hasWon(comp.id) ? 'text-green-600 font-semibold' : 'text-gray-500'
                }`}
              >
                {comp.logo ? (
                  <Image 
                    src={comp.logo} 
                    alt={comp.name} 
                    width={16}
                    height={16}
                    className="w-4 h-4"
                    unoptimized
                  />
                ) : (
                  <div className="w-4 h-4 bg-gray-300 rounded flex-shrink-0"></div>
                )}
                <span>{comp.name}</span>
                {hasWon(comp.id) && <span>🏆</span>}
              </li>
            ))}
          </ul>
        </details>
      </div>
    </BlurredCard>
  );
};

export default TrophyCountry;
