import type { CareerTeam, SaveCompetition, SaveDetails } from './types';

// JSON values accepted by the season API, matching the web season form.
export const CUP_ROUNDS = [
  'Preliminary Round', 'First Qualifying Round', 'Second Qualifying Round',
  'Third Qualifying Round', 'Fourth Qualifying Round', 'Playoff Round',
  'Group Stage', 'First Round', 'Second Round', 'Third Round', 'Fourth Round',
  'Round of 32', 'Round of 16', 'Quarter-Final', 'Semi-Final', 'Final', 'Winners',
] as const;

export type CupEntry = { competition: SaveCompetition | null; reachedRound: string };

function requireDate(value: string, label: string) {
  const parsed = new Date(`${value}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(`${label} must be a valid date in YYYY-MM-DD format.`);
  }
}

export function nextSeason(save: Pick<SaveDetails, 'season' | 'seasons'>) {
  const latest = save.seasons.map(item => item.season).sort().at(-1);
  if (!latest) return save.season;
  const year = Number(latest.split('/')[0]) + 1;
  return `${year}/${String((year + 1) % 100).padStart(2, '0')}`;
}

export function teamLabel(team: CareerTeam) {
  return `${team.name}${team.isFemale === true ? ' (Women)' : ''}${team.national ? ' (National team)' : ''}`;
}

export function competitionPath(team: CareerTeam, type?: string, includeWorld = false) {
  const params = new URLSearchParams({ country: team.countryCode, isFemale: String(team.isFemale === true) });
  if (includeWorld && team.countryCode !== 'WOR') params.append('country', 'WOR');
  if (type) params.set('type', type);
  return `/api/competitions?${params}`;
}

export function selectedCompetition(items: SaveCompetition[], id: string) {
  if (!id) return null;
  const competition = items.find(item => String(item.id) === id);
  if (!competition) throw new Error('The selected competition is unavailable. Please choose it again.');
  return competition;
}

export function stintBody(team: CareerTeam | null, league: SaveCompetition | null, startDate: string, endDate: string) {
  if (!team) throw new Error('Please select a team.');
  requireDate(startDate, 'Start date');
  if (endDate) {
    requireDate(endDate, 'End date');
    if (endDate < startDate) throw new Error('End date cannot be before start date.');
  }
  return {
    teamId: String(team.id),
    leagueId: !team.national && league ? String(league.id) : '',
    startDate,
    endDate: endDate || null,
    isNational: team.national,
  };
}

export function trophyBody(team: CareerTeam | null, competition: SaveCompetition | null, dateWon: string) {
  if (!team) throw new Error('Please select a team from your career history.');
  if (!competition) throw new Error('Please select a competition.');
  requireDate(dateWon, 'Date won');
  return {
    teamId: String(team.id),
    competitionId: String(competition.id),
    countryCode: competition.countryCode,
    dateWon,
  };
}

export function seasonBody({ season, team, league, position, promoted, relegated, cups }: {
  season: string;
  team: CareerTeam | null;
  league: SaveCompetition | null;
  position: string;
  promoted: boolean;
  relegated: boolean;
  cups: CupEntry[];
}) {
  if (!team) throw new Error('Please select a team from your career history.');
  const year = Number(season.slice(0, 4));
  if (!/^\d{4}\/\d{2}$/.test(season) || Number(season.slice(5)) !== (year + 1) % 100) {
    throw new Error('Season must use consecutive years in YYYY/YY format, for example 2026/27.');
  }
  if (Boolean(league) !== Boolean(position.trim())) throw new Error('League and league position must be provided together.');
  if (league && (!/^\d+$/.test(position) || Number(position) < 1 || !Number.isSafeInteger(Number(position)))) {
    throw new Error('League position must be a positive whole number.');
  }
  return {
    season,
    teamId: String(team.id),
    ...(league ? {
      leagueId: String(league.id),
      leaguePosition: Number(position),
      promoted: league.tier === 1 ? false : promoted,
      relegated,
    } : {}),
    cupResults: cups.map(cup => {
      if (!cup.competition) throw new Error('Please select a competition for every cup result.');
      if (!CUP_ROUNDS.some(round => round === cup.reachedRound)) throw new Error('Please select a valid cup round.');
      return {
        competitionId: String(cup.competition.id),
        countryCode: cup.competition.countryCode,
        reachedRound: cup.reachedRound,
      };
    }),
  };
}
