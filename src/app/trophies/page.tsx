'use client';

import { CountryWithCompetitions } from '@/lib/types/Country&Competition';
import { TrophyGroup } from '@/lib/types/Trophy';
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/components/AuthProvider';
import FootballLoader from '@/app/components/FootBallLoader';
import CircleProgress from '@/app/components/progress/CircleProgress';
import Image from 'next/image';
import BlurredCard from '../components/BlurredCard';

export default function TrophiesPage() {
  const { user, userLoading } = useAuth();
  const [countries, setCountries] = useState<CountryWithCompetitions[]>([]);
  const [trophies, setTrophies] = useState<TrophyGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      if (!user) {
        const compsRes = await fetch('/api/competitions/grouped');
        const compsData = await compsRes.json();
        setCountries(compsData);
        setLoading(false);
        return;
      }
      
      // Get token and fetch data
      const token = await user.getIdToken();
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // Fetch competitions and trophies
      const [compsRes, trophiesRes] = await Promise.all([
        fetch('/api/competitions/grouped', { headers }),
        fetch('/api/trophies', { headers }),
      ]);

      // Check if both requests were successful
      if (!compsRes.ok || !trophiesRes.ok) {
        console.error('Failed to fetch competitions or trophies');
        setLoading(false);
        return;
      }

      // Get JSON data
      const compsData = await compsRes.json();
      const trophiesData = await trophiesRes.json();

      // Set state with fetched data
      setCountries(compsData);
      setTrophies(trophiesData);
      setLoading(false);
    }
    
    // Wait for user to be loaded
    if (userLoading) return;
    else {
      fetchAll();
    }

  }, [user, userLoading]);

  if (loading) {
    return <FootballLoader />;
  }

  if (!countries?.length) {
    return <div>No competitions found</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">🏆 Trophies Checklist</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
        {countries.sort((a, b) => a.name.localeCompare(b.name)).map((country) => {
          return <TrophyCountry key={country.code} country={country} trophies={trophies} />;
        })}
      </div>
    </div>
  );
}

function TrophyCountry({ country, trophies }: { country: CountryWithCompetitions, trophies: TrophyGroup[] }) {
  const hasWon = (competitionId: number) => trophies.some((t) => String(t.competitionId) === String(competitionId));
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
            {comps.map((comp) => (
              <li
                key={comp.id}
                className={`flex items-center gap-2 ${
                  hasWon(comp.id) ? 'text-green-600 font-semibold' : 'text-gray-500'
                }`}
              >
                <Image 
                  src={comp.logo} 
                  alt={comp.name} 
                  width={16}
                  height={16}
                  className="w-4 h-4"
                  unoptimized
                />
                <span>{comp.name}</span>
                {hasWon(comp.id) && <span>🏆</span>}
              </li>
            ))}
          </ul>
        </details>
      </div>
    </BlurredCard>
  );
}