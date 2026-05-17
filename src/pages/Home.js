import { renderCountdown, initCountdown } from '../components/Countdown.js';
import { renderMatchCard } from '../components/MatchCard.js';
import matchesData from '../data/matches.json';

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getMatchesForDate(date) {
  return matchesData.filter(m => m.date === date);
}

function getNextUpcomingDate() {
  const today = getTodayDate();
  const dates = [...new Set(matchesData.map(m => m.date))].sort();
  return dates.find(d => d >= today) || dates[0];
}

export function Home() {
  setTimeout(() => initCountdown(), 0);

  const today = getTodayDate();
  const todayMatches = getMatchesForDate(today);
  const upcomingDate = getNextUpcomingDate();
  const upcomingMatches = getMatchesForDate(upcomingDate)
    .filter(m => m.status !== 'STATUS_FULL_TIME' && m.status !== 'STATUS_POSTPONED')
    .slice(0, 6);

  // If no matches today and upcoming is same date, don't duplicate
  const hasTodaySection = todayMatches.length > 0 && today !== upcomingDate;
  const displayMatches = hasTodaySection ? upcomingMatches : upcomingMatches;

  return `
    <section class="hero-section" style="background: linear-gradient(180deg, var(--bg-tertiary) 0%, var(--bg-primary) 100%); padding: var(--spacing-3xl) 0; text-align: center;">
      <div class="container">
        <h1 style="font-size: clamp(3rem, 8vw, 6rem); letter-spacing: 2px; margin-bottom: var(--spacing-md); text-shadow: 0 4px 12px rgba(0,0,0,0.5);">
          MUNDIAL FIFA 2026™
        </h1>
        <div style="font-size: 1.2rem; color: var(--text-secondary); margin-bottom: var(--spacing-xl); text-transform: uppercase; letter-spacing: 3px;">
          <span style="display: inline-block; margin: 0 10px;">Estados Unidos</span> •
          <span style="display: inline-block; margin: 0 10px;">México</span> •
          <span style="display: inline-block; margin: 0 10px;">Canadá</span>
        </div>
      </div>
    </section>

    <section class="container countdown-section" style="margin-top: -2rem; margin-bottom: var(--spacing-3xl); position: relative; z-index: 10;">
      <div class="countdown-card">
        <h2 style="text-align: center; color: var(--accent-primary); font-size: 1.5rem; letter-spacing: 2px; margin-bottom: var(--spacing-lg);">CUENTA REGRESIVA</h2>
        ${renderCountdown()}
      </div>
    </section>

    ${todayMatches.length > 0 ? `
    <section class="container" style="margin-bottom: var(--spacing-3xl);">
      <div class="flex justify-between items-center" style="margin-bottom: var(--spacing-lg);">
        <h2 style="font-size: 2rem; letter-spacing: 1px;">
          PARTIDOS DE HOY
          <span class="live-badge" style="font-size: 0.7rem; vertical-align: middle; margin-left: 8px;">HOY</span>
        </h2>
      </div>
      <div class="grid md:grid-cols-2 lg:grid-cols-3">
        ${todayMatches.map(match => renderMatchCard(match)).join('')}
      </div>
    </section>
    ` : ''}

    <section class="container" style="margin-bottom: var(--spacing-3xl);">
      <div class="flex justify-between items-center" style="margin-bottom: var(--spacing-lg);">
        <h2 style="font-size: 2rem; letter-spacing: 1px;">
          ${todayMatches.length > 0 ? 'PRÓXIMOS PARTIDOS' : `PARTIDOS DEL ${formatDate(upcomingDate)}`}
        </h2>
        <a href="#/schedule" style="color: var(--accent-secondary); font-weight: 600; text-transform: uppercase; font-size: 0.9rem;">Ver Calendario Completo &rarr;</a>
      </div>
      <div class="grid md:grid-cols-2 lg:grid-cols-3">
        ${displayMatches.map(match => renderMatchCard(match)).join('')}
      </div>
    </section>

    <section class="container" style="margin-bottom: var(--spacing-3xl);">
      <div class="quick-stats grid grid-cols-2 md:grid-cols-4 gap-md">
        <div class="stat-card">
          <div class="stat-value">${matchesData.length}</div>
          <div class="stat-label">Partidos</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">48</div>
          <div class="stat-label">Selecciones</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">16</div>
          <div class="stat-label">Estadios</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">3</div>
          <div class="stat-label">Países Sede</div>
        </div>
      </div>
    </section>
  `;
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' }).toUpperCase();
}
