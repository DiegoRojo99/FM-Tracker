'use client';

import { useState } from 'react';
import { FullCareerStint } from '@/lib/types/prisma/Career';
import CareerTimeline from './CareerTimeline';
import AddCareerStintModal from '@/app/components/modals/AddCareerStintModal';
import GradientButton from '@/app/components/GradientButton';
import { useAuth } from '@/app/components/AuthProvider';
import { FullDetailsSave } from '@/lib/types/prisma/Save';

type Props = {
  saveDetails: FullDetailsSave;
  setRefresh: (refresh: boolean) => void; // Optional prop for refreshing
};

export default function CareerStintsSection({ saveDetails, setRefresh }: Props) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [editingStint, setEditingStint] = useState<FullCareerStint | null>(null);

  const handleSuccess = () => {
    setRefresh(true);
    setEditingStint(null);
  };

  const onUpdateStint = (stint: FullCareerStint) => {
    setEditingStint(stint);
    setIsOpen(true);
  };

  const onDeleteStint = async (stintId: number) => {
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

      {saveDetails.careerStints?.length ? (
        <CareerTimeline
          saveDetails={saveDetails}
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
        saveDetails={saveDetails}
        onSuccess={handleSuccess}
        editingStint={editingStint}
      />
    </section>
  );
}
