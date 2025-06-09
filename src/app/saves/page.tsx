'use client'

import { useEffect, useState } from 'react'
// import Link from 'next/link'
import { Save } from '@/lib/types/RetrieveDB'
import { useAuth } from '../components/AuthProvider';

export default function SavesPage() {
  const { user } = useAuth();
  
  const [saves, setSaves] = useState<Save[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchSaves = async () => {
      const token = await user.getIdToken();

      fetch('/api/saves', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then(res => res.json())
      .then(setSaves)
      .finally(() => setLoading(false));
    };

    fetchSaves();
  }, [user])

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Your Saves</h1>
      <div className="grid gap-4">
        {saves.map(save => (
          // <Link key={save.id} href={`/saves/${save.id}`}>
            <div key={save.id} className="p-4 rounded-xl border hover:shadow transition-all">
              <p>Team ID: {save.teamId}, League ID: {save.leagueId}, Country Code: {save.countryCode}</p>
            </div>
          // </Link>
        ))}
      </div>
    </div>
  )
}
