import matchesData from './data/matches.json';
import { updateLiveMatch, getLiveMatch, getLiveCount, subscribe } from './data/live-store.js';

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

function parseEspnEvent(event) {
  const competition = event.competitions?.[0];
  if (!competition) return null;

  const home = competition.competitors?.find(c => c.homeAway === 'home');
  const away = competition.competitors?.find(c => c.homeAway === 'away');
  if (!home || !away) return null;

  const status = competition.status?.type?.name || '';
  const displayClock = competition.status?.displayClock || '';
  const isLive = status === 'STATUS_IN_PROGRESS' || status === 'STATUS_HALFTIME';
  const isFinished = status === 'STATUS_FULL_TIME' || status === 'STATUS_POSTPONED';
  const isHalfTime = status === 'STATUS_HALFTIME';

  return {
    id: event.id,
    homeScore: home.score || '0',
    awayScore: away.score || '0',
    status,
    minute: isLive && !isHalfTime ? displayClock : '',
    isLive,
    isFinished,
    isHalfTime,
    broadcasts: competition.broadcasts?.flatMap(b => b.names || []) || [],
  };
}

function updateStoreAndDOM(event) {
  const parsed = parseEspnEvent(event);
  if (!parsed) return;

  updateLiveMatch(parsed.id, parsed);
  patchMatchCard(parsed);
}

function patchMatchCard(data) {
  const card = document.querySelector(`a.match-card[href="#/match/${data.id}"]`);
  if (!card) return;

  const timeEl = card.querySelector('.match-time');
  if (timeEl) {
    timeEl.textContent = `${data.homeScore} - ${data.awayScore}`;
    timeEl.style.color = data.isLive ? 'var(--accent-danger)' : '';
  }

  const metaEl = card.querySelector('.match-meta');
  if (metaEl) {
    metaEl.textContent = '';
    if (data.isLive) {
      const badge = document.createElement('span');
      badge.className = 'live-badge';
      badge.textContent = data.isHalfTime ? 'MEDIO TIEMPO' : `EN VIVO ${data.minute}`;
      metaEl.appendChild(badge);
    } else if (data.isFinished) {
      const badge = document.createElement('span');
      badge.className = 'ft-badge';
      badge.textContent = 'FT';
      metaEl.appendChild(badge);
    }
  }
}

export function startPolling() {
  if (pollIntervalId) return;
  if (!isTournamentActive() && !isMatchDay()) return;

  pollIntervalId = setInterval(async () => {
    const events = await fetchLiveScores();
    if (!events) return;
    events.forEach(updateStoreAndDOM);
  }, POLL_INTERVAL);

  fetchLiveScores().then(events => {
    if (events) events.forEach(updateStoreAndDOM);
  });
}

export function stopPolling() {
  if (pollIntervalId) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
  }
}

export function repatchAllCards() {
  document.querySelectorAll('a.match-card').forEach(card => {
    const href = card.getAttribute('href') || '';
    const matchId = href.split('/').pop();
    if (!matchId) return;
    const data = getLiveMatch(matchId);
    if (data) patchMatchCard(data);
  });
}
