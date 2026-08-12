'use client';

import { InstantSearch, useHits, useSearchBox } from 'react-instantsearch';
import { algoliaClient } from '@/lib/algolia/algolia';
import { useState } from 'react';
import { Team } from '@/lib/types/prisma/Team';
import { AlgoliaTeam } from '@/lib/types/Algolia';

interface SearchDropdownProps {
  onTeamSelect: (team: Team) => void;
}

export default function SearchDropdown({ onTeamSelect }: SearchDropdownProps) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <InstantSearch indexName="teams_index" searchClient={algoliaClient}>
      <div className="relative">
        <CustomSearchBox
          query={query}
          setQuery={setQuery}
          setShowDropdown={setShowDropdown}
        />
        {showDropdown && (
          <CustomHits
            onTeamSelect={(team) => {
              setQuery(team.name);
              setShowDropdown(false);
              onTeamSelect(team);
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
      placeholder="Search for a team..."
      className="w-full rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] px-3 py-2 text-sm text-white placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
    />
  );
}

function CustomHits({ onTeamSelect }: { onTeamSelect: (team: Team) => void }) {
  const { hits }: { hits: AlgoliaTeam[] } = useHits();
  if (!hits.length) return null;

  function parseTeam(hit: AlgoliaTeam): Team {
    const { lat, lng } = !!hit.coordinates ? hit.coordinates : { lat: null, lng: null };
    return {
      id: hit.id,
      name: hit.name,
      logo: hit.logo,
      countryCode: hit.countryCode,
      national: hit.national,
      isFemale: typeof hit.isFemale === 'boolean' ? hit.isFemale : null,
      lat: (typeof lat === 'number' ? lat : null),
      lng: (typeof lng === 'number' ? lng : null),
    };
  }

  return (
    <ul className="absolute z-20 mt-1 w-full overflow-y-auto rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-darker)] shadow-xl" style={{ maxHeight: 220 }}>
      {hits.map((hit) => {
        const team = hit as AlgoliaTeam;
        return (
          <li
            key={team.id}
            className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm text-white transition hover:bg-white/8"
            onMouseDown={() => onTeamSelect(parseTeam(team))}
          >
            <span className="font-medium">{team.name}</span>
            {team.countryCode && (
              <span className="text-xs text-[var(--color-text-muted)]">{team.countryCode}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}