// Lightweight reactive store for live match data
// ESPN + API-Football pollers write here, components subscribe to changes

const liveData = new Map();
const listeners = new Set();

export function updateLiveMatch(matchId, data) {
  const existing = liveData.get(matchId) || {};
  liveData.set(matchId, { ...existing, ...data, updatedAt: Date.now() });
  listeners.forEach(fn => fn(matchId, liveData.get(matchId)));
}

export function getLiveMatch(matchId) {
  return liveData.get(matchId) || null;
}

export function getAllLive() {
  const matches = [];
  liveData.forEach((data, id) => {
    if (data.isLive) matches.push({ id, ...data });
  });
  return matches;
}

export function getLiveCount() {
  let count = 0;
  liveData.forEach(data => { if (data.isLive) count++; });
  return count;
}

export function clearLiveMatch(matchId) {
  liveData.delete(matchId);
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getStoreSize() {
  return liveData.size;
}
