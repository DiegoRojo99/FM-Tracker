'use client';

import { FullCareerStint } from '@/lib/types/prisma/Career';
import { FullDetailsSaveWithOwnership } from '@/lib/types/prisma/Save';
import Image from 'next/image';
import { useState } from 'react';

type Props = {
  saveDetails: FullDetailsSaveWithOwnership;
  onUpdateStint?: (stint: FullCareerStint) => void;
  onDeleteStint?: (stintId: number) => void;
};

function groupStintsByStart(stints: FullCareerStint[]) {
  const grouped: Record<string, FullCareerStint[]> = {};

  stints.forEach((stint) => {
    const key = stint.startDate.toString();
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(stint);
  });

  return Object.entries(grouped)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([startDate, entries]) => ({
      startDate,
      entries,
    }));
}

function formatDate(datePassed: string): string {
  const date = new Date(datePassed);
  const month = date.toLocaleString(undefined, { month: 'long' });
  const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
  return `${capitalizedMonth} ${date.getFullYear()}`;
}

export default function CareerTimeline({ saveDetails, onUpdateStint, onDeleteStint }: Props) {
  const grouped = groupStintsByStart(saveDetails.careerStints);

  return (
    <div className="overflow-auto py-6">
      <div className="relative flex flex-col gap-8 md:flex-row md:gap-12 md:min-w-max items-center">

        {/* Timeline Line */}
        <div className="absolute top-0 left-2/7 -translate-x-1/2 h-full w-0.5 bg-purple-500 md:top-4 md:h-0.5 md:w-full z-0" />

        {grouped.map(({ startDate, entries }, idx) => (
          <div
            key={idx}
            className="relative flex sm:flex-row-reverse items-start gap-4 md:flex-col md:items-center md:gap-2"
          >
            {/* Dot */}
            <div className="hidden md:block z-10 h-4 w-4 rounded-full bg-purple-600 border-2 border-white shadow-md md:mt-2 md:self-center md:h-4 md:w-4" />

            {/* Date + Entries */}
            <div className="flex flex-col gap-1 md:mt-1 md:items-center">
              <div className="text-sm text-gray-500 md:text-center ml-[25%] sm:ml-0">
                {formatDate(startDate)}
              </div>

              {entries.map((stint, sIdx) => (
                <CareerStintCard 
                  key={sIdx} 
                  stint={stint} 
                  onUpdate={onUpdateStint}
                  onDelete={onDeleteStint}
                  isOwner={saveDetails.isOwner}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


function CareerStintCard({ 
  stint, 
  onUpdate, 
  onDelete,
  isOwner = false
}: { 
  stint: FullCareerStint;
  onUpdate?: (stint: FullCareerStint) => void;
  onDelete?: (stintId: number) => void;
  isOwner?: boolean;
}) {
  const [showActions, setShowActions] = useState(false);

  const handleDelete = () => {
    console.log('Deleting career stint:', stint);
    if (!stint.id) return;
    const deleteConfirmed = window.confirm(`Are you sure you want to delete the career stint at ${stint.team?.name}?`);
    if (deleteConfirmed) {
      onDelete?.(stint.id);
    }
  };

  const handleUpdate = () => {
    if (!stint.id) return;
    onUpdate?.(stint);
  };

  return (
    <div 
      className="bg-purple-50 dark:bg-purple-900 border border-purple-600 rounded-lg shadow p-3 w-60 flex flex-col items-center text-center relative group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Action buttons */}
      {isOwner && (onUpdate || onDelete) && (
        <div className={`absolute top-2 right-2 flex gap-1 transition-opacity duration-200 ${showActions ? 'opacity-100' : 'opacity-0'}`}>
          {onUpdate && (
            <button
              onClick={handleUpdate}
              className="p-1 text-white rounded text-xs transition-colors"
              title="Edit career stint"
            >
              <Image
                src="/pencil.svg"
                alt="Edit Icon"
                width={16}
                height={16}
                className="h-4 w-4 white-image hover:cursor-pointer hover:opacity-80 hover:scale-110 transition-transform"
              />
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="p-1 text-white rounded text-xs transition-colors"
              title="Delete career stint"
            >
              <Image
                src="/trash.svg"
                alt="Trash Icon"
                width={16}
                height={16}
                className="h-4 w-4 white-image hover:cursor-pointer hover:opacity-80 hover:scale-110 transition-transform"
              />
            </button>
          )}
        </div>
      )}

      {stint.team && stint.team.logo && (
        <Image
          width={128}
          height={128}
          src={stint.team.logo}
          alt={stint.team.name}
          className="h-20 w-20 object-contain mb-2"
        />
      )}
      <div className="font-semibold">{stint.team?.name}</div>
      <div className="text-xs text-gray-500">
        {formatDate(stint.startDate)} —{' '}
        {stint.endDate ? formatDate(stint.endDate) : 'Present'}
      </div>
    </div>
  );
}