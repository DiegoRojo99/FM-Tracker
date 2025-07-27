'use client';

import { useState } from 'react';
import { SaveWithChildren } from '@/lib/types/Save';
import CareerTimeline from './CareerTimeline';
import AddCareerStintModal from '@/app/components/modals/AddCareerStintModal';
import GradientButton from '@/app/components/GradientButton';

type Props = {
  saveDetails: SaveWithChildren;
  setRefresh: (refresh: boolean) => void; // Optional prop for refreshing
};

export default function CareerStintsSection({ saveDetails, setRefresh }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = () => {
    setRefresh(true); // Refresh the parent component
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
        />
      ) : (
        <div className='text-sm text-gray-500 mt-4'>No career stints found.</div>
      )}

      <AddCareerStintModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        saveId={saveDetails.id}
        onSuccess={handleSuccess}
      />
    </section>
  );
}
