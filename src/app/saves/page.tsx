'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../components/AuthProvider';
import { SaveWithDetails } from '@/lib/types/Save';
import Image from 'next/image';

export default function SavesPage() {
  const { user } = useAuth();
  
  const [saves, setSaves] = useState<SaveWithDetails[]>([]);
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
      <div className='mb-6 flex flex-row items-center justify-between'>
        <h1 className="text-2xl font-bold mb-4">Your Saves</h1>
        <Link href="/add-save" className="inline-block mb-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
          Create New Save
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {saves.map(save => (
          <Link key={save.id} href={`/saves/${save.id}`}>
            <div className="p-4 rounded-xl border hover:shadow transition-all w-full flex flex-col items-center gap-4 
            cursor-pointer hover:border-purple-600 hover:bg-purple-50 hover:dark:bg-purple-900">
              <Image
                src={save.team?.logo}
                alt={save.team?.name}
                width={128}
                height={128}
              />
              <h2 className="text-xl font-semibold">{save.team?.name}</h2>
              <Image
                src={save.league?.logo}
                alt={save.league?.name}
                width={128}
                height={128}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
