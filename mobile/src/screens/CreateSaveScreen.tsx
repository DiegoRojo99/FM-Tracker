import { useCallback, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useApi } from '../auth/AuthProvider';
import { SelectField } from '../components/SelectField';
import { Button, ResourceState, Screen } from '../components/ui';
import { useResource } from '../hooks/useResource';
import type { ApiClient } from '../lib/api';
import type { Competition, Game, Team } from '../lib/types';
import type { SavesStackParams } from '../navigation';
import { styles } from '../theme';

type Country = { code: string; name: string };
type League = Competition & { isFemale: boolean | null; tier: number | null };
type GameVersion = Game & { releaseDate: string | null };

const loadSetup = async (api: ApiClient) => {
  const [countries, { games }] = await Promise.all([
    api<Country[]>('/api/countries?fmOnly=true'),
    api<{ games: GameVersion[] }>('/api/games?active=true'),
  ]);
  return {
    countries: [...countries].sort((a, b) => a.name.localeCompare(b.name)),
    games: [...games].sort((a, b) => (b.releaseDate ?? '').localeCompare(a.releaseDate ?? '')),
  };
};

function leagueLabel(league: League) {
  return `${league.name}${league.isFemale === true ? ' (Women)' : ''}`;
}

export function CreateSaveScreen({ navigation }: NativeStackScreenProps<SavesStackParams, 'CreateSave'>) {
  const api = useApi();
  const setup = useResource(loadSetup);
  const [step, setStep] = useState(1);
  const [gameId, setGameId] = useState('fm27');
  const [unemployed, setUnemployed] = useState(false);
  const [country, setCountry] = useState('');
  const [leagueId, setLeagueId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitLock = useRef(false);
  const request = useRef<{ fingerprint: string; id: string } | null>(null);

  const leagues = useResource(useCallback(async (client: ApiClient) => ({
    gameId,
    country,
    items: country && !unemployed
      ? await client<League[]>(`/api/competitions?country=${encodeURIComponent(country)}&type=DOMESTIC_LEAGUE&gameId=${encodeURIComponent(gameId)}`)
      : [],
  }), [gameId, country, unemployed]));
  const teams = useResource(useCallback(async (client: ApiClient) => ({
    gameId,
    leagueId,
    items: leagueId && !unemployed
      ? await client<Team[]>(`/api/teams?leagueId=${encodeURIComponent(leagueId)}&gameId=${encodeURIComponent(gameId)}`)
      : [],
  }), [gameId, leagueId, unemployed]));

  const availableLeagues = leagues.data?.gameId === gameId && leagues.data.country === country ? leagues.data.items : [];
  const availableTeams = teams.data?.gameId === gameId && teams.data.leagueId === leagueId ? teams.data.items : [];
  const selectedGame = setup.data?.games.find(game => game.id === gameId);
  const selectedCountry = setup.data?.countries.find(item => item.code === country);
  const selectedLeague = availableLeagues.find(league => String(league.id) === leagueId);
  const selectedTeam = availableTeams.find(team => String(team.id) === teamId);
  const validSetup = Boolean(selectedGame) && !setup.loading && !setup.error;
  const validTeam = unemployed || Boolean(selectedCountry && selectedLeague && selectedTeam && !leagues.loading && !teams.loading && !leagues.error && !teams.error);
  const sortedLeagues = [...availableLeagues].sort((a, b) =>
    Number(a.isFemale === true) - Number(b.isFemale === true)
    || (a.tier ?? Number.MAX_SAFE_INTEGER) - (b.tier ?? Number.MAX_SAFE_INTEGER)
    || a.name.localeCompare(b.name));

  function clearTeam() {
    setLeagueId('');
    setTeamId('');
    setError(null);
  }

  async function submit() {
    if (submitLock.current) return;
    if (step !== 3 || !validSetup || !validTeam) {
      setError('Please review your game version and starting setup before creating a save.');
      return;
    }
    submitLock.current = true;
    setSaving(true);
    setError(null);
    const body = {
      gameId,
      countryCode: unemployed ? null : country,
      leagueId: unemployed ? null : Number(leagueId),
      startingTeamId: unemployed ? null : Number(teamId),
    };
    const fingerprint = JSON.stringify(body);
    if (request.current?.fingerprint !== fingerprint) {
      request.current = { fingerprint, id: `${Date.now()}${Math.floor(Math.random() * 1_000_000)}` };
    }
    const requestId = request.current.id;
    try {
      const save = await api<{ id: string }>('/api/saves', {
        method: 'POST',
        headers: { 'X-Idempotency-Key': requestId },
        body: JSON.stringify({ ...body, requestId }),
      });
      navigation.replace('SaveDetails', { id: save.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create your save. Please try again.');
    } finally {
      submitLock.current = false;
      setSaving(false);
    }
  }

  return (
    <Screen title="Create new save" eyebrow={`Step ${step} of 3: ${step === 1 ? 'Setup' : step === 2 ? 'Team' : 'Review'}`} subtitle="Choose your game version and start your next career." hasHeader>
      <ResourceState {...setup} retry={setup.refresh} hasData={Boolean(setup.data)} />
      {setup.data && !setup.loading && !setup.error && <>
        {step === 1 && <View style={styles.panel}>
          <SelectField label="Game version" value={gameId} options={setup.data.games.map(game => ({ value: game.id, label: game.name }))} onChange={value => {
            setGameId(value);
            setCountry('');
            clearTeam();
          }} />
          {!setup.data.games.length && <Text style={styles.error}>No active game versions are available.</Text>}
          <Text style={styles.heading}>Starting option</Text>
          <Button title="Choose team" secondary={unemployed} onPress={() => { setUnemployed(false); setTeamId(''); setError(null); }} />
          <Button title="Unemployed" secondary={!unemployed} onPress={() => { setUnemployed(true); setCountry(''); clearTeam(); }} />
          <Text style={styles.body}>FM27 starts in 2026/27. Choose an older game version for an older career.</Text>
        </View>}
        {step === 2 && (unemployed ? <View style={styles.panel}>
          <Text style={styles.heading}>Unemployed start</Text>
          <Text style={styles.body}>Start without a team and add your first appointment later.</Text>
        </View> : <View style={styles.panel}>
          <SelectField label="Country" value={country} options={setup.data.countries.map(item => ({ value: item.code, label: item.name }))} onChange={value => { setCountry(value); clearTeam(); }} />
          {!setup.data.countries.length && <Text style={styles.error}>No Football Manager countries are available.</Text>}
          {country && <ResourceState {...leagues} retry={leagues.refresh} hasData={false} />}
          <SelectField label="League" value={leagueId} options={sortedLeagues.map(league => ({ value: String(league.id), label: leagueLabel(league) }))} disabled={!country || leagues.loading || Boolean(leagues.error)} onChange={value => { setLeagueId(value); setTeamId(''); setError(null); }} />
          {country && !leagues.loading && !leagues.error && !availableLeagues.length && <Text style={styles.body}>No domestic leagues are available for this country.</Text>}
          {leagueId && <ResourceState {...teams} retry={teams.refresh} hasData={false} />}
          <SelectField label="Team" value={teamId} options={availableTeams.map(team => ({ value: String(team.id), label: team.name, logo: team.logo }))} disabled={!selectedLeague || teams.loading || Boolean(teams.error)} onChange={value => { setTeamId(value); setError(null); }} />
          {leagueId && !teams.loading && !teams.error && !availableTeams.length && <Text style={styles.body}>No teams are available for this league and game version.</Text>}
        </View>)}
        {step === 3 && <>
          <View style={styles.panel}>
            <Text style={styles.heading}>Review your setup</Text>
            <Text style={styles.body}>Game: {selectedGame?.name}</Text>
            <Text style={styles.body}>Start type: {unemployed ? 'Unemployed' : 'Choose team'}</Text>
            {!unemployed && <>
              <Text style={styles.body}>Country: {selectedCountry?.name}</Text>
              <Text style={styles.body}>League: {selectedLeague ? leagueLabel(selectedLeague) : 'Not selected'}</Text>
              <Text style={styles.body}>Team: {selectedTeam?.name ?? 'Not selected'}</Text>
            </>}
          </View>
          <View style={styles.inset}>
            <Text style={styles.eyebrow}>Starter challenge recommendation</Text>
            <Text style={styles.heading}>{unemployed ? 'Journeyman Starter' : 'Club Builder Starter'}</Text>
            <Text style={styles.body}>{unemployed ? 'A challenge path focused on your first appointment and survival milestones.' : 'A challenge path focused on squad building and first-season stability goals.'}</Text>
          </View>
        </>}
        {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        {step > 1 && <Button title="Back" secondary disabled={saving} onPress={() => { setStep(step - 1); setError(null); }} />}
        {step < 3
          ? <Button title="Continue" disabled={!validSetup || (step === 2 && !validTeam)} onPress={() => { setStep(step + 1); setError(null); }} />
          : <Button title={saving ? 'Creating save...' : unemployed ? 'Create unemployed save' : 'Create save'} icon="add-outline" disabled={!validSetup || !validTeam || saving} busy={saving} onPress={() => void submit()} />}
      </>}
    </Screen>
  );
}
