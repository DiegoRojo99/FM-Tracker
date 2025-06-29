'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../components/AuthProvider';
import { Save } from '@/lib/types/Save';
import FootballLoader from '../components/FootBallLoader';
import { SaveCard } from './SaveCard';

export default function SavesPage() {
  const { user, userLoading } = useAuth();
  const [saves, setSaves] = useState<Save[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user && userLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

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
  }, [user, userLoading]);

  if (loading) {
    return <FootballLoader />;
  }

  if (!user) {
    return (
      <div className='p-6'>
        <p className='text-gray-500'>Please log in to view your saves.</p>
      </div>
    );
  }

  if (!saves || saves.length === 0) {
    return (
      <div className='p-6'>
        <p className='text-gray-500'>No saves found.</p>
      </div>
    );
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
        {saves.map(save => ( <SaveCard key={save.id} save={save} /> ))}
      </div>
    </div>
  )
}
