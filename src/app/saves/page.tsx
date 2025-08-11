'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../components/AuthProvider';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import { Save } from '@/lib/types/Save';
import FootballLoader from '../components/FootBallLoader';
import { SaveCard } from './SaveCard';
import GradientButton from '../components/GradientButton';

export default function SavesPage() {
  const { user, userLoading } = useAuth();
  const [saves, setSaves] = useState<Save[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingSave, setDeletingSave] = useState<Save | null>(null);

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

  
  function handleDelete(event: React.MouseEvent, saveId: string) {
    // Avoid default action of the link
    event.preventDefault();
    
    // Check if user is logged in
    if (!user) return;
    
    // Find the save to delete and open confirmation modal
    const saveToDelete = saves.find(save => save.id === saveId);
    if (saveToDelete) {
      setDeletingSave(saveToDelete);
    }
  }

  async function confirmDelete() {
    if (!deletingSave || !user) return;
    
    const token = await user.getIdToken();
    
    const response = await fetch(`/api/saves/${deletingSave.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete save');
    }
    
    // Remove the deleted save from the state
    setSaves(prevSaves => prevSaves.filter(save => save.id !== deletingSave.id));
    setDeletingSave(null);
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

      <ConfirmationModal
        open={!!deletingSave}
        onClose={() => setDeletingSave(null)}
        onConfirm={confirmDelete}
        title="Delete Save"
        message={`Are you sure you want to delete the save for ${deletingSave?.currentClub?.name || deletingSave?.currentNT?.name || 'No Team'}? This action cannot be undone.`}
        confirmText="Delete"
        destructive={true}
      />
    </div>
  )
}
