'use client';

import { InstantSearch, useHits, useSearchBox } from 'react-instantsearch';
import { algoliaClient } from '@/lib/algolia/algolia';
import { Competition } from '@/lib/types/RetrieveDB';
import { useState } from 'react';

interface SearchDropdownProps {
  onCompetitionSelect: (competition: Competition) => void;
}

export default function SearchDropdown({ onCompetitionSelect }: SearchDropdownProps) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <InstantSearch indexName="competitions_index" searchClient={algoliaClient}>
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
      style={{ width: '100%', padding: '8px' }}
    />
  );
}

function CustomHits({ onCompetitionSelect }: { onCompetitionSelect: (competition: Competition) => void }) {
  const { hits } = useHits();
  if (!hits.length) return null;

  return (
    <ul
      style={{
        position: 'absolute',
        zIndex: 10,
        width: '100%',
        background: 'var(--background)',
        border: '1px solid #ccc',
        margin: 0,
        padding: 0,
        listStyle: 'none',
        maxHeight: 200,
        overflowY: 'auto',
      }}
    >
      {hits.map((hit) => {
        const competition = hit as Competition;
        return (
          <li
            key={competition.id}
            style={{ padding: '8px', cursor: 'pointer' }}
            onMouseDown={() => onCompetitionSelect(competition)} // prevents input blur interruption
          >
            {competition.name}
          </li>
        );
      })}
    </ul>
  );
}