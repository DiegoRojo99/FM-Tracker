'use client';

import { CountryWithCompetitions } from '@/lib/types/Country&Competition';
import { Trophy } from '@/lib/types/Trophy';
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/components/AuthProvider';
import FootballLoader from '@/app/components/FootBallLoader';
import CircleProgress from '@/app/components/progress/CircleProgress';
import Image from 'next/image';


export default function TrophiesPage() {
  const { user, userLoading } = useAuth();
  const [countries, setCountries] = useState<CountryWithCompetitions[]>([]);
  const [trophies, setTrophies] = useState<Trophy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      if (!user) return;
      const token = await user.getIdToken();
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [compsRes, trophiesRes] = await Promise.all([
        fetch('/api/competitions/grouped', { headers }),
        fetch('/api/trophies', { headers }),
      ]);

      const compsData = await compsRes.json();
      const trophiesData = await trophiesRes.json();

      setCountries(compsData);
      setTrophies(trophiesData);
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

  const hasWon = (competitionId: number) =>
    trophies.some((t) => String(t.competitionId) === String(competitionId));

  if (loading) {
    return <FootballLoader />;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">🏆 Trophies Checklist</h1>

      {countries.sort((a, b) => a.name.localeCompare(b.name)).map((country) => {
        const comps = country.competitions || [];
        const total = comps.length;
        const won = comps.filter((c) => hasWon(c.id)).length;

        return (
          <div key={country.code} className="border rounded-lg bg-white shadow p-4 text-black">
            <details className="space-y-2">
              <summary className="cursor-pointer flex items-center justify-between mb-0">
                <div className="flex items-center gap-2">
                  <Image 
                    src={country.flag} 
                    alt={country.name} 
                    width={20}
                    height={20}
                    className="w-5 h-5" 
                  />
                  <span className="font-semibold">{country.name}</span>
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
                    />
                    <span>{comp.name}</span>
                    {hasWon(comp.id) && <span>🏆</span>}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        );
      })}
    </div>
  );
}
