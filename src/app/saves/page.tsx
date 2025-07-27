'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../components/AuthProvider';
import { Save } from '@/lib/types/Save';
import FootballLoader from '../components/FootBallLoader';
import { SaveCard } from './SaveCard';
import GradientButton from '../components/GradientButton';

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

  
  async function handleDelete(event: React.MouseEvent, saveId: string) {
    // Avoid default action of the link
    event.preventDefault();
    
    // Check if user is logged in
    if (!user) return;
    
    // Confirm deletion with the user
    if (confirm('Are you sure you want to delete this save?')) {
      const token = await user.getIdToken();
      try {
        const response = await fetch(`/api/saves/${saveId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          alert('Save deleted successfully');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } 
        else {
          alert('Failed to delete save');
        }
      } catch (error) {
        console.error('Error deleting save:', error);
        alert('Error deleting save');
      }
    }
  }

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
        <h1 className="text-2xl font-bold">Your Saves</h1>
        <Link href="/add-save" className="inline-block">
          <GradientButton>
            Create New Save
          </GradientButton>
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {saves.map(save => ( <SaveCard key={save.id} save={save} handleDelete={handleDelete} /> ))}
      </div>
    </div>
  )
}
