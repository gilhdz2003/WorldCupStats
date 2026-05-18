import matchesData from './data/matches.json';

const ESPN_SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
const POLL_INTERVAL = 30000;
const TOURNAMENT_START = new Date('2026-06-11T00:00:00Z').getTime();
const TOURNAMENT_END = new Date('2026-07-20T00:00:00Z').getTime();

let pollIntervalId = null;

function isTournamentActive() {
  const now = Date.now();
  return now >= TOURNAMENT_START && now <= TOURNAMENT_END;
}

function isMatchDay() {
  const today = new Date().toISOString().slice(0, 10);
  return matchesData.some(m => m.date === today);
}

export async function fetchLiveScores() {
  try {
    const res = await fetch(ESPN_SCOREBOARD_URL);
    if (!res.ok) return null;
    const data = await res.json();
    return data.events || [];
  } catch {
    return null;
  }
}

function updateMatchCard(event) {
  const matchId = event.id;
  const card = document.querySelector(`a.match-card[href="#/match/${matchId}"]`);
  if (!card) return;

  const competition = event.competitions?.[0];
  if (!competition) return;

  const home = competition.competitors?.find(c => c.homeAway === 'home');
  const away = competition.competitors?.find(c => c.homeAway === 'away');
  if (!home || !away) return;

  const homeScore = home.score || '0';
  const awayScore = away.score || '0';
  const status = competition.status?.type?.name || '';
  const displayClock = competition.status?.displayClock || '';
  const minute = status === 'STATUS_IN_PROGRESS' ? displayClock : '';

  const isLive = status === 'STATUS_IN_PROGRESS' || status === 'STATUS_HALFTIME';
  const isFinished = status === 'STATUS_FULL_TIME' || status === 'STATUS_POSTPONED';

  const timeEl = card.querySelector('.match-time');
  if (timeEl) {
    timeEl.textContent = `${homeScore} - ${awayScore}`;
    if (isLive) timeEl.style.color = 'var(--accent-danger)';
  }

  const metaEl = card.querySelector('.match-meta');
  if (metaEl) {
    let badge = '';
    if (isLive) {
      badge = `<span class="live-badge">EN VIVO${minute ? ' ' + minute : ''}</span>`;
    } else if (isFinished) {
      badge = '<span class="ft-badge">FT</span>';
    }
    const venue = card.querySelector('.match-meta')?.textContent?.split('•').pop()?.trim() || '';
    metaEl.textContent = '';
    metaEl.textContent = '';
    const text = document.createTextNode('');
    metaEl.appendChild(text);
    if (badge) {
      const temp = document.createElement('div');
      temp.textContent = badge; // safe: badge is from our controlled strings
    }
    metaEl.textContent = `${badge}${venue}`;
  }
}

export function startPolling() {
  if (pollIntervalId) return;
  if (!isTournamentActive() || !isMatchDay()) return;

  pollIntervalId = setInterval(async () => {
    const events = await fetchLiveScores();
    if (!events) return;
    events.forEach(updateMatchCard);
  }, POLL_INTERVAL);

  fetchLiveScores().then(events => {
    if (events) events.forEach(updateMatchCard);
  });
}

export function stopPolling() {
  if (pollIntervalId) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
  }
}
