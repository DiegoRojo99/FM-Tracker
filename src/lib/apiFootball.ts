const BASE_URL = 'https://v3.football.api-sports.io';

export async function fetchFromApi(endpoint: string) {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    throw new Error('Missing API_FOOTBALL_KEY environment variable');
  }
  
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'x-apisports-key': apiKey,
    },
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const data = await res.json();
  return data.response;
}
