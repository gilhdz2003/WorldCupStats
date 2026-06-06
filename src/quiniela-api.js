const API_BASE = '/api/';
const TOKEN_KEY = 'quiniela_token';
const USER_KEY = 'quiniela_user';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function getUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
}

function isLoggedIn() { return !!getToken(); }

async function apiFetch(url, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API_BASE + url, { ...options, headers: { ...headers, ...options.headers } });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) clearSession();
    throw new Error(data.error || 'Error de servidor');
  }
  return data;
}

// Auth
export async function register(name, email) {
  const data = await apiFetch('quiniela-auth.php?action=register', {
    method: 'POST', body: JSON.stringify({ name, email })
  });
  return data;
}

export async function verifyEmail(email, code) {
  return apiFetch('quiniela-auth.php?action=verify', {
    method: 'POST', body: JSON.stringify({ email, code })
  });
}

export async function login(email, pin) {
  const data = await apiFetch('quiniela-auth.php?action=login', {
    method: 'POST', body: JSON.stringify({ email, pin })
  });
  if (data.ok && data.token) {
    setSession(data.token, data.user);
  }
  return data;
}

export async function logout() {
  try {
    await apiFetch('quiniela-auth.php?action=logout', { method: 'POST' });
  } catch {}
  clearSession();
}

export async function getMe() {
  const data = await apiFetch('quiniela-auth.php?action=me');
  if (data.ok && data.user) {
    setSession(getToken(), data.user);
  }
  return data;
}

// Predictions
export async function getMyPredictions() {
  return apiFetch('quiniela-predictions.php');
}

export async function savePredictions(predictions) {
  return apiFetch('quiniela-predictions.php', {
    method: 'POST', body: JSON.stringify({ predictions })
  });
}

// Matches
export async function getMatches(phase) {
  const url = phase ? `quiniela-matches.php?phase=${phase}` : 'quiniela-matches.php';
  return apiFetch(url);
}

// Leaderboard
export async function getLeaderboard(phase) {
  const url = phase && phase !== 'all' ? `quiniela-leaderboard.php?phase=${phase}` : 'quiniela-leaderboard.php';
  return apiFetch(url);
}

// Admin
export async function adminGetParticipants() {
  return apiFetch('quiniela-admin.php?action=participants');
}

export async function adminGetPhases() {
  return apiFetch('quiniela-admin.php?action=phases');
}

export async function adminTogglePhase(phase, isOpen) {
  return apiFetch('quiniela-admin.php?action=toggle-phase', {
    method: 'POST', body: JSON.stringify({ phase, is_open: isOpen ? 1 : 0 })
  });
}

export async function adminSetScore(matchId, homeScore, awayScore) {
  return apiFetch('quiniela-admin.php?action=set-score', {
    method: 'POST', body: JSON.stringify({ match_id: matchId, home_score: homeScore, away_score: awayScore })
  });
}

export async function adminResetPin(userId) {
  return apiFetch('quiniela-admin.php?action=reset-pin', {
    method: 'POST', body: JSON.stringify({ user_id: userId })
  });
}

export async function adminExport() {
  const token = getToken();
  const res = await fetch(API_BASE + 'quiniela-admin.php?action=export', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  return res;
}

export async function adminExportPredictions(phase) {
  const token = getToken();
  const url = phase && phase !== 'all'
    ? `quiniela-admin.php?action=export-predictions&phase=${phase}`
    : 'quiniela-admin.php?action=export-predictions';
  const res = await fetch(API_BASE + url, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  return res;
}

// Helpers
export { isLoggedIn, getUser, getToken, clearSession };
