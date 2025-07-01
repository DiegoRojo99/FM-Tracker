'use client';

import FootballLoader from "@/app/components/FootBallLoader";
import { Competition } from "@/lib/types/Country&Competition";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function TeamsPage() {
  const [leaguesPulled, setLeaguesPulled] = useState<Competition[]>([]);
  const [leaguesNotPulled, setLeaguesNotPulled] = useState<Competition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTeams = async () => {
      const response = await fetch("/api/admin/leagues");
      const {
        leaguesPulled,
        leaguesNotPulled,
      } = await response.json();
      
      setLeaguesPulled(leaguesPulled);
      setLeaguesNotPulled(leaguesNotPulled);
      setLoading(false);
    };
    fetchTeams();
  }, [loading]);

  async function seedTeams(leagueId: string) {
    const res = await fetch(`/api/admin/leagues/${leagueId}`, {
      method: "POST",
    });
    if (res.ok) {
      alert("Teams seeded successfully!");
      setLoading(true); // Trigger re-fetch
    }
  }

  if (loading) {
    return <FootballLoader />;
  }

  return (
    <div className="container mx-auto p-4">
      {/* Pulled */}
      <h1 className="text-2xl font-bold mb-4 text-center">Competitions Pulled</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {leaguesPulled.map((league) => (
          <div key={league.id} className="flex flex-col items-center p-4 rounded-lg shadow bg-purple-500">
            <Image
              src={league.logo}
              alt={`${league.name} logo`}
              width={100}
              height={100}
              className="mb-2 flex-1 object-contain"
              unoptimized
            />
            <h2 className="text-l font-semibold h-fit pt-2">{league.name}</h2>
            <h5 className="text-sm">{league.countryCode}</h5>
          </div>
        ))}
      </div>

      {/* Not Pulled */}
      <h1 className="text-2xl font-bold mb-4 text-center mt-8">Competitions Not Pulled</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {leaguesNotPulled.map((league) => (
          <div key={league.id} className="flex flex-col items-center p-4 rounded-lg shadow bg-purple-500" onClick={() => seedTeams(String(league.id))}>
            <Image
              src={league.logo}
              alt={`${league.name} logo`}
              width={100}
              height={100}
              className="mb-2 flex-1 object-contain"
              unoptimized
            />
            <h2 className="text-l font-semibold h-fit pt-2">{league.name}</h2>
            <h5 className='text-sm'>{league.countryCode}</h5>
          </div>
        ))}
      </div>
    </div>
  );
}