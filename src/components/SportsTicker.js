import { translateTeam } from '../data/team-names-es.js';

/**
 * Render a horizontal scrolling ticker with today's match results.
 * Shows finished matches from the given data arrays.
 * If no matches, shows a pre-tournament placeholder.
 */
export function renderSportsTicker(matches, liveMatches) {
  // Find today's finished matches
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const finished = matches.filter(m => {
    const matchDate = m.match_date || '';
    return matchDate.startsWith(today) && (m.status === 'finished' || (m.home_score != null));
  });

  // Also check live store for any finished matches
  const liveFinished = [];
  if (liveMatches && liveMatches.size > 0) {
    liveMatches.forEach((data, id) => {
      if (data.isFinished && !finished.find(m => m.id === id)) {
        // Create a minimal match-like object for the ticker
        finished.push({
          id: data.id,
          home_team: `Match #${id}`,
          away_team: '',
          home_score: data.homeScore,
          away_score: data.awayScore,
        });
      }
    });
  }

  if (finished.length === 0) {
    return `
      <div class="q-ticker">
        <div class="q-ticker-track">
          <div class="q-ticker-item q-ticker-item--placeholder">
            ⚽ El Mundial FIFA 2026 inicia el 11 de Junio — ¡Prepárate!
          </div>
        </div>
      </div>`;
  }

  // Duplicate items for seamless infinite scroll
  const items = finished.map(m => {
    const home = translateTeam(m.home_team);
    const away = translateTeam(m.away_team);
    const score = `${m.home_score} - ${m.away_score}`;
    return `<div class="q-ticker-item">
      <span class="q-ticker-home">${home}</span>
      <span class="q-ticker-score">${score}</span>
      <span class="q-ticker-away">${away}</span>
      <span class="q-ticker-badge">FT</span>
    </div>`;
  });

  const doubled = [...items, ...items]; // duplicate for seamless loop

  return `
    <div class="q-ticker">
      <div class="q-ticker-track">
        ${doubled.map(item => item).join('')}
      </div>
    </div>
  `;
}
