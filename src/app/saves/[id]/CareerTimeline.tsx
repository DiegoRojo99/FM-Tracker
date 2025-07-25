'use client';

import { CareerStint } from '@/lib/types/Career';
import Image from 'next/image';

type Props = {
  stints: CareerStint[];
};

function groupStintsByStart(stints: CareerStint[]) {
  const grouped: Record<string, CareerStint[]> = {};

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

export default function CareerTimeline({ stints }: Props) {
  const grouped = groupStintsByStart(stints);

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

              {entries.map((stint, sIdx) => {
                return (
                  <div
                    key={sIdx}
                    className="bg-purple-50 dark:bg-purple-900 border border-purple-600 rounded-lg shadow p-3 w-60 flex flex-col items-center text-center"
                  >
                    {stint.teamLogo && (
                      <Image
                        width={128}
                        height={128}
                        src={stint.teamLogo}
                        alt={stint.teamName}
                        className="h-20 w-20 object-contain mb-2"
                      />
                    )}
                    <div className="font-semibold">{stint.teamName}</div>
                    <div className="text-xs text-gray-500">
                      {formatDate(stint.startDate)} —{' '}
                      {stint.endDate ? formatDate(stint.endDate) : 'Present'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
