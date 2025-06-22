import { Country } from '@/lib/types/Country&Competition';
import React, { useEffect, useState } from 'react';

interface CountryDropdownProps {
  value?: string;
  onChange?: (value: string) => void;
}

const CountryDropdown: React.FC<CountryDropdownProps> = ({ value, onChange }) => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCountries = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/countries');
        if (!res.ok) throw new Error('Failed to fetch countries');
        const data = await res.json();
        setCountries(data);
      } catch (error) {
        setCountries([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCountries();
  }, []);

  return (
    <select
      value={value || ''}
      onChange={e => onChange?.(e.target.value)}
      disabled={loading}
    >
      <option value="">Select a country</option>
      {countries.map(country => (
        <option key={country.code} value={country.code}>
          {country.name}
        </option>
      ))}
    </select>
  );
};

export default CountryDropdown;