'use client';

import { useState } from 'react';
import { SaveWithChildren } from '@/lib/types/Save';
import { CareerStint } from '@/lib/types/Career';
import CareerTimeline from './CareerTimeline';
import AddCareerStintModal from '@/app/components/modals/AddCareerStintModal';
import GradientButton from '@/app/components/GradientButton';
import { useAuth } from '@/app/components/AuthProvider';

type Props = {
  saveDetails: SaveWithChildren;
  setRefresh: (refresh: boolean) => void; // Optional prop for refreshing
};

export default function CareerStintsSection({ saveDetails, setRefresh }: Props) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editingStint, setEditingStint] = useState<CareerStint | null>(null);

  const handleSuccess = () => {
    setRefresh(true);
    setEditingStint(null);
  };

  const onUpdateStint = (stint: CareerStint) => {
    setEditingStint(stint);
    setIsOpen(true);
  };

  const onDeleteStint = async (stintId: string) => {
    try {
      if (!user) {
        console.error('User is not authenticated');
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch(`/api/saves/${saveDetails.id}/career/${stintId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete career stint');
      }

      setRefresh(true);
    } catch (error) {
      console.error('Error deleting career stint:', error);
      alert('Failed to delete career stint. Please try again.');
    }
  };

  return (
    <section className="w-full">
      <div className="mb-2 sm:mb-6 flex flex-row items-center justify-between">
        <h3 className="text-xl font-semibold">Career Stints</h3>
        <GradientButton onClick={() => setIsOpen(true)}>
          + Add Stint
        </GradientButton>
      </div>

      {saveDetails.career?.length ? (
        <CareerTimeline
          stints={saveDetails.career}
          onUpdateStint={onUpdateStint}
          onDeleteStint={onDeleteStint}
        />
      ) : (
        <div className='text-sm text-gray-500 mt-4'>No career stints found.</div>
      )}

      <AddCareerStintModal
        open={isOpen}
        onClose={() => {
          setIsOpen(false);
          setEditingStint(null);
        }}
        saveId={saveDetails.id}
        onSuccess={handleSuccess}
        editingStint={editingStint}
      />
    </section>
  );
}
