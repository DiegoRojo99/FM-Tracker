import { useCallback, useRef, useState, type ComponentProps } from 'react';
import { Switch, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useApi } from '../auth/AuthProvider';
import { SelectField } from '../components/SelectField';
import { Button, ResourceState, Screen } from '../components/ui';
import { useResource } from '../hooks/useResource';
import type { ApiClient } from '../lib/api';
import { competitionPath, CUP_ROUNDS, nextSeason, seasonBody, selectedCompetition, stintBody, teamLabel, trophyBody } from '../lib/saveEntries';
import type { CareerTeam, SaveCompetition, SaveDetails } from '../lib/types';
import type { SavesStackParams } from '../navigation';
import { colors, styles } from '../theme';

type FormProps = { save: SaveDetails; onSaved: () => void };
type CupChoice = { key: number; competitionId: string; reachedRound: string };

function TextField({ label, ...props }: ComponentProps<typeof TextInput> & { label: string }) {
  return <View style={{ gap: 8 }}>
    <Text style={styles.small}>{label}</Text>
    <TextInput accessibilityLabel={label} placeholderTextColor="#8d85a8" style={styles.input} autoCorrect={false} {...props} />
  </View>;
}

function Toggle({ label, value, onChange, disabled }: { label: string; value: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  return <View style={styles.between}>
    <Text style={styles.body}>{label}</Text>
    <Switch accessibilityLabel={label} value={value} onValueChange={onChange} disabled={disabled} trackColor={{ true: colors.primary }} thumbColor={colors.text} />
  </View>;
}

function useCompetitions(team: CareerTeam | null, type?: string, includeWorld = false) {
  const path = team ? competitionPath(team, type, includeWorld) : null;
  const resource = useResource(useCallback(async (api: ApiClient) => ({
    path,
    items: path ? await api<SaveCompetition[]>(path) : [],
  }), [path]));
  const items = resource.data?.path === path ? resource.data.items : [];
  return { ...resource, items };
}

function competitionOptions(items: SaveCompetition[]) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name)).map(item => ({
    value: String(item.id),
    label: `${item.name}${item.isFemale === true ? ' (Women)' : ''}${item.countryCode === 'WOR' ? ' (International)' : ''}`,
  }));
}

function careerTeams(save: SaveDetails) {
  return Array.from(new Map(save.careerStints.map(stint => [stint.team.id, stint.team])).values());
}

function useSubmission(save: SaveDetails, endpoint: string, onSaved: () => void) {
  const api = useApi();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  async function submit(build: () => object) {
    if (lock.current) return;
    lock.current = true;
    setError(null);
    try {
      if (!save.isOwner) throw new Error('You can only modify your own saves.');
      const body = build();
      setSaving(true);
      await api(`/api/saves/${encodeURIComponent(save.id)}/${endpoint}`, { method: 'POST', body: JSON.stringify(body) });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save. Please try again.');
    } finally {
      lock.current = false;
      setSaving(false);
    }
  }
  return { saving, error, submit };
}

function TeamSearch({ selected, onChange, disabled }: { selected: CareerTeam | null; onChange: (team: CareerTeam | null) => void; disabled: boolean }) {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const resource = useResource(useCallback(async (api: ApiClient) => ({
    search,
    items: search ? await api<CareerTeam[]>(`/api/teams?name=${encodeURIComponent(search)}`) : [],
  }), [search]));
  const teams = resource.data?.search === search ? resource.data.items : [];
  return <>
    <TextField label="Team search" placeholder="Enter at least 2 characters" value={query} onChangeText={setQuery} editable={!disabled} autoCapitalize="none" />
    <Button title="Search teams" disabled={disabled || query.trim().length < 2 || resource.loading} onPress={() => {
      onChange(null);
      if (search === query.trim()) resource.refresh();
      else setSearch(query.trim());
    }} />
    {search && <ResourceState {...resource} retry={resource.refresh} hasData={false} />}
    <SelectField label="Team" value={selected ? String(selected.id) : ''} options={teams.map(team => ({ value: String(team.id), label: teamLabel(team), logo: team.logo }))} disabled={disabled || !search || resource.loading || Boolean(resource.error)} onChange={value => onChange(teams.find(team => String(team.id) === value) ?? null)} />
    {search && !resource.loading && !resource.error && !teams.length && <Text style={styles.body}>No teams found. Try another name.</Text>}
  </>;
}

function StintForm({ save, onSaved }: FormProps) {
  const [team, setTeam] = useState<CareerTeam | null>(null);
  const [leagueId, setLeagueId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const leagues = useCompetitions(team && !team.national ? team : null, 'DOMESTIC_LEAGUE');
  const submission = useSubmission(save, 'career', onSaved);
  return <View style={styles.panel}>
    <TeamSearch selected={team} disabled={submission.saving} onChange={value => { setTeam(value); setLeagueId(''); }} />
    {team && !team.national && <>
      <ResourceState {...leagues} retry={leagues.refresh} hasData={false} />
      <SelectField label="League (optional)" value={leagueId} options={[{ value: '', label: 'No league' }, ...competitionOptions(leagues.items)]} disabled={submission.saving || leagues.loading || Boolean(leagues.error)} onChange={setLeagueId} />
    </>}
    {team?.national && <Text style={styles.body}>This appointment is for a national team. Your club appointment is kept separately.</Text>}
    <TextField label="Start date" placeholder="YYYY-MM-DD" value={startDate} onChangeText={setStartDate} editable={!submission.saving} />
    <TextField label="End date (optional)" placeholder="YYYY-MM-DD" value={endDate} onChangeText={setEndDate} editable={!submission.saving} />
    <Text style={styles.small}>A new stint closes the previous open appointment of the same type at its start date.</Text>
    {submission.error && <Text accessibilityRole="alert" style={styles.error}>{submission.error}</Text>}
    <Button title={submission.saving ? 'Saving stint...' : 'Save stint'} disabled={submission.saving || !team || !startDate || (Boolean(leagueId) && (leagues.loading || Boolean(leagues.error)))} busy={submission.saving} onPress={() => void submission.submit(() => stintBody(team, selectedCompetition(leagues.items, leagueId), startDate.trim(), endDate.trim()))} />
  </View>;
}

function SeasonForm({ save, onSaved }: FormProps) {
  const teams = careerTeams(save);
  const [teamId, setTeamId] = useState('');
  const [season, setSeason] = useState(() => nextSeason(save));
  const [leagueId, setLeagueId] = useState('');
  const [position, setPosition] = useState('');
  const [promoted, setPromoted] = useState(false);
  const [relegated, setRelegated] = useState(false);
  const [cups, setCups] = useState<CupChoice[]>([]);
  const cupKey = useRef(0);
  const team = teams.find(item => String(item.id) === teamId) ?? null;
  const leagues = useCompetitions(team, 'DOMESTIC_LEAGUE');
  const competitions = useCompetitions(team, 'DOMESTIC_CUP,CONTINENTAL_CLUB', true);
  const league = leagues.items.find(item => String(item.id) === leagueId);
  const submission = useSubmission(save, 'seasons', onSaved);
  const blocked = submission.saving;

  function changeTeam(value: string) {
    setTeamId(value);
    setLeagueId('');
    setPosition('');
    setPromoted(false);
    setRelegated(false);
    setCups([]);
  }

  return <View style={styles.panel}>
    <TextField label="Season" placeholder="2026/27" value={season} onChangeText={setSeason} editable={!blocked} />
    <SelectField label="Team" value={teamId} options={teams.map(item => ({ value: String(item.id), label: teamLabel(item), logo: item.logo }))} disabled={blocked || !teams.length} onChange={changeTeam} />
    {!teams.length && <Text style={styles.body}>No teams found. Add a career stint first.</Text>}
    {team && <>
      <ResourceState {...leagues} retry={leagues.refresh} hasData={false} />
      <SelectField label="League (optional)" value={leagueId} options={[{ value: '', label: 'No league result' }, ...competitionOptions(leagues.items)]} disabled={blocked || leagues.loading || Boolean(leagues.error)} onChange={value => {
        setLeagueId(value);
        setPosition('');
        setPromoted(false);
        setRelegated(false);
      }} />
      {leagueId && <>
        <TextField label="League position" keyboardType="number-pad" value={position} onChangeText={setPosition} editable={!blocked} />
        <Toggle label={league?.tier === 1 ? 'Promoted (not available in top flight)' : 'Promoted'} value={promoted} disabled={blocked || league?.tier === 1} onChange={value => { setPromoted(value); if (value) setRelegated(false); }} />
        <Toggle label="Relegated" value={relegated} disabled={blocked} onChange={value => { setRelegated(value); if (value) setPromoted(false); }} />
      </>}
      <Text style={styles.heading}>Cup results</Text>
      {cups.length > 0 && <ResourceState {...competitions} retry={competitions.refresh} hasData={false} />}
      {cups.map((cup, index) => <View key={cup.key} style={styles.inset}>
        <SelectField label={`Cup ${index + 1}`} value={cup.competitionId} options={competitionOptions(competitions.items)} disabled={blocked || competitions.loading || Boolean(competitions.error)} onChange={value => setCups(items => items.map(item => item.key === cup.key ? { ...item, competitionId: value } : item))} />
        <SelectField label={`Round reached ${index + 1}`} value={cup.reachedRound} options={CUP_ROUNDS.map(round => ({ value: round, label: round }))} disabled={blocked} onChange={value => setCups(items => items.map(item => item.key === cup.key ? { ...item, reachedRound: value } : item))} />
        <Button title={`Remove cup ${index + 1}`} secondary disabled={blocked} onPress={() => setCups(items => items.filter(item => item.key !== cup.key))} />
      </View>)}
      <Button title="Add cup result" disabled={blocked} onPress={() => {
        const key = ++cupKey.current;
        setCups(items => [...items, { key, competitionId: '', reachedRound: CUP_ROUNDS[0] }]);
      }} />
    </>}
    {submission.error && <Text accessibilityRole="alert" style={styles.error}>{submission.error}</Text>}
    <Button title={blocked ? 'Saving season...' : 'Save season'} disabled={blocked || !team || !season || (Boolean(leagueId) && (leagues.loading || Boolean(leagues.error))) || (cups.length > 0 && (competitions.loading || Boolean(competitions.error)))} busy={blocked} onPress={() => void submission.submit(() => seasonBody({
      season: season.trim(), team, league: selectedCompetition(leagues.items, leagueId), position,
      promoted, relegated,
      cups: cups.map(cup => ({ competition: selectedCompetition(competitions.items, cup.competitionId), reachedRound: cup.reachedRound })),
    }))} />
  </View>;
}

function TrophyForm({ save, onSaved }: FormProps) {
  const teams = careerTeams(save);
  const [teamId, setTeamId] = useState('');
  const [competitionId, setCompetitionId] = useState('');
  const [dateWon, setDateWon] = useState('');
  const team = teams.find(item => String(item.id) === teamId) ?? null;
  const competitions = useCompetitions(team, undefined, true);
  const submission = useSubmission(save, 'trophies', onSaved);
  return <View style={styles.panel}>
    <SelectField label="Team" value={teamId} options={teams.map(item => ({ value: String(item.id), label: teamLabel(item), logo: item.logo }))} disabled={submission.saving || !teams.length} onChange={value => { setTeamId(value); setCompetitionId(''); }} />
    {!teams.length && <Text style={styles.body}>No teams found. Add a career stint first.</Text>}
    {team && <ResourceState {...competitions} retry={competitions.refresh} hasData={false} />}
    <SelectField label="Competition" value={competitionId} options={competitionOptions(competitions.items)} disabled={submission.saving || !team || competitions.loading || Boolean(competitions.error)} onChange={setCompetitionId} />
    <TextField label="Date won" placeholder="YYYY-MM-DD" value={dateWon} onChangeText={setDateWon} editable={!submission.saving} />
    {submission.error && <Text accessibilityRole="alert" style={styles.error}>{submission.error}</Text>}
    <Button title={submission.saving ? 'Saving trophy...' : 'Save trophy'} disabled={submission.saving || !team || !competitionId || !dateWon || competitions.loading || Boolean(competitions.error)} busy={submission.saving} onPress={() => void submission.submit(() => trophyBody(team, selectedCompetition(competitions.items, competitionId), dateWon.trim()))} />
  </View>;
}

export function SaveEntryScreen({ route, navigation }: NativeStackScreenProps<SavesStackParams, 'AddSaveEntry'>) {
  const { id, kind } = route.params;
  const resource = useResource(useCallback((api: ApiClient) => api<SaveDetails>(`/api/saves/${encodeURIComponent(id)}`), [id]));
  const save = resource.data?.id === id ? resource.data : null;
  const Form = kind === 'stint' ? StintForm : kind === 'season' ? SeasonForm : TrophyForm;
  return <Screen title={`Add ${kind === 'stint' ? 'career stint' : kind}`} eyebrow="Your career" hasHeader>
    <ResourceState {...resource} retry={resource.refresh} hasData={Boolean(save)} />
    {save && !resource.error && (save.isOwner
      ? <Form key={`${id}:${kind}`} save={save} onSaved={() => navigation.goBack()} />
      : <Text accessibilityRole="alert" style={styles.error}>You can only modify your own saves.</Text>)}
  </Screen>;
}
