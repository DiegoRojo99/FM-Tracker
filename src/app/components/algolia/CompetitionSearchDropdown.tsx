'use client';

import { InstantSearch, useHits, useSearchBox } from 'react-instantsearch';
import { algoliaClient } from '@/lib/algolia/algolia';
import { useState } from 'react';
import { AlgoliaCompetition } from '@/lib/types/Algolia';

interface SearchDropdownProps {
  onCompetitionSelect: (competition: AlgoliaCompetition) => void;
}

export default function SearchDropdown({ onCompetitionSelect }: SearchDropdownProps) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <InstantSearch indexName="competitions_index" searchClient={algoliaClient}>
      <div className="relative">
        <CustomSearchBox
          query={query}
          setQuery={setQuery}
          setShowDropdown={setShowDropdown}
        />
        {showDropdown && (
          <CustomHits
            onCompetitionSelect={(competition) => {
              setQuery(competition.name);
              setShowDropdown(false);
              onCompetitionSelect(competition);
            }}
          />
        )}
      </div>
    </InstantSearch>
  );
}

function CustomSearchBox({
  query,
  setQuery,
  setShowDropdown,
}: {
  query: string;
  setQuery: (value: string) => void;
  setShowDropdown: (value: boolean) => void;
}) {
  const { refine } = useSearchBox();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setShowDropdown(true);
    refine(newQuery);
  };

  return (
    <input
      type="text"
      value={query}
      onChange={handleChange}
      placeholder="Search for a competition..."
      className="w-full rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-3 py-2 text-sm text-white placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
    />
  );
}

function CustomHits({ onCompetitionSelect }: { onCompetitionSelect: (competition: AlgoliaCompetition) => void }) {
  const { hits }: { hits: AlgoliaCompetition[] } = useHits();
  if (!hits.length) return null;

  return (
    <ul className="absolute z-20 mt-1 w-full overflow-y-auto rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] shadow-xl" style={{ maxHeight: 220 }}>
      {hits.map((hit) => {
        const competition = hit as AlgoliaCompetition;
        return (
          <li
            key={competition.id}
            className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm text-white transition hover:bg-white/8"
            onMouseDown={() => onCompetitionSelect(competition)}
          >
            <span className="font-medium">{competition.name}</span>
            {competition.countryName && (
              <span className="text-xs text-[var(--color-text-muted)]">{competition.countryName}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}