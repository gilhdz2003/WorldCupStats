// API-Football client — all requests go through our PHP proxy
// Proxy handles auth, rate limiting, and endpoint whitelisting

const PROXY_URL = '/api/football-proxy.php';

async function apiGet(endpoint, params = {}) {
  const qs = new URLSearchParams({ endpoint, ...params }).toString();
  try {
    const res = await fetch(`${PROXY_URL}?${qs}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.errors && Object.keys(data.errors).length > 0) return null;
    return data;
  } catch {
    return null;
  }
}

// Live fixtures across all leagues
export async function getLiveFixtures() {
  const data = await apiGet('/fixtures', { live: 'all' });
  return data?.response || [];
}

// Specific fixture by ID (for match page detail)
export async function getFixture(fixtureId) {
  const data = await apiGet('/fixtures', { id: fixtureId });
  return data?.response?.[0] || null;
}

// Match events: goals, cards, subs
export async function getFixtureEvents(fixtureId) {
  const data = await apiGet('/fixtures/events', { fixture: fixtureId });
  return data?.response || [];
}

// Match statistics: possession, shots, corners
export async function getFixtureStats(fixtureId) {
  const data = await apiGet('/fixtures/statistics', { fixture: fixtureId });
  return data?.response || [];
}

// Lineups
export async function getFixtureLineups(fixtureId) {
  const data = await apiGet('/fixtures/lineups', { fixture: fixtureId });
  return data?.response || [];
}

// Team info
export async function getTeam(teamId) {
  const data = await apiGet('/teams', { id: teamId });
  return data?.response?.[0] || null;
}

// World Cup standings for a season
export async function getStandings(season = 2026) {
  const data = await apiGet('/standings', { league: 1, season });
  return data?.response?.[0] || null;
}

// World Cup fixtures by date
export async function getFixturesByDate(date) {
  const data = await apiGet('/fixtures', { league: 1, season: 2026, date });
  return data?.response || [];
}

// Head to head between two teams
export async function getHeadToHead(team1, team2, last = 5) {
  const data = await apiGet('/fixtures/headtohead', { h2h: `${team1}-${team2}`, last });
  return data?.response || [];
}

// Odds for a fixture (Phase 7)
export async function getFixtureOdds(fixtureId) {
  const data = await apiGet('/odds', { fixture: fixtureId });
  return data?.response || [];
}
