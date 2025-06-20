'use client';

import { InstantSearch, useHits, useSearchBox } from 'react-instantsearch';
import { algoliaClient } from '@/lib/algolia/algolia';
import { useState } from 'react';
import { Team } from '@/lib/types/Team';
import { AlgoliaTeam } from '@/lib/types/Algolia';

interface SearchDropdownProps {
  onTeamSelect: (team: Team) => void;
}

export default function SearchDropdown({ onTeamSelect }: SearchDropdownProps) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <InstantSearch indexName="teams_index" searchClient={algoliaClient}>
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
      style={{ width: '100%', padding: '8px' }}
    />
  );
}

function CustomHits({ onTeamSelect }: { onTeamSelect: (team: Team) => void }) {
  const { hits }: { hits: AlgoliaTeam[] } = useHits();
  if (!hits.length) return null;

  function parseTeam(hit: AlgoliaTeam): Team {
    return {
      id: hit.id,
      name: hit.name,
      logo: hit.logo,
      countryCode: hit.countryCode,
      leagueId: hit.leagueId,
      season: hit.season,
      national: hit.national,
      coordinates: {
        lat: (hit.coordinates && typeof hit.coordinates.lat === 'number' ? hit.coordinates.lat : null),
        lng: (hit.coordinates && typeof hit.coordinates.lng === 'number' ? hit.coordinates.lng : null),
      },
    };
  }

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
        const team = hit as AlgoliaTeam;
        return (
          <li
            key={team.id}
            style={{ padding: '8px', cursor: 'pointer' }}
            onMouseDown={() => onTeamSelect(parseTeam(team))} // prevents input blur interruption
          >
            {team.name}
          </li>
        );
      })}
    </ul>
  );
}