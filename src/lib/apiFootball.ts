const API_KEY = process.env.API_FOOTBALL_KEY!;
const BASE_URL = 'https://v3.football.api-sports.io';

export async function fetchFromApi(endpoint: string) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'x-apisports-key': API_KEY,
    },
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const data = await res.json();
  return data.response;
}
