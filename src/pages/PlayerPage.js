import teamsData from '../data/teams.json';
import playersData from '../data/players.json';

const POSITION_FULL = {
  'GK': 'Portero',
  'DF': 'Defensa',
  'MF': 'Mediocampista',
  'FW': 'Delantero',
};

export function PlayerPage(playerId) {
  let player = null;
  let teamAbbr = null;

  for (const [abbr, data] of Object.entries(playersData)) {
    const found = data.players?.find(p => p.id === playerId);
    if (found) {
      player = found;
      teamAbbr = abbr;
      break;
    }
  }

  if (!player) return '<div class="container"><h1>Jugador no encontrado</h1></div>';

  const team = teamsData.find(t => t.abbreviation === teamAbbr);
  const initials = player.name.split(' ').map(w => w[0]).slice(0, 2).join('');
  const posColor = { GK: 'var(--accent-info)', DF: 'var(--accent-success)', MF: 'var(--accent-secondary)', FW: 'var(--accent-danger)' }[player.position] || 'var(--text-muted)';

  const stats = player.stats || {};
  const trophies = player.trophies || [];

  const statsGrid = [
    { label: 'Partidos', value: stats.games || 0 },
    { label: 'Goles', value: stats.goals || 0 },
    { label: 'Asistencias', value: stats.assists || 0 },
    { label: 'Minutos', value: stats.minutes || 0 },
    { label: 'Amarillas', value: stats.yellowCards || 0 },
    { label: 'Rojas', value: stats.redCards || 0 },
  ];

  return `
    <section class="container" style="padding: var(--spacing-2xl) 0;">
      <a href="#/team/${teamAbbr}" class="player-back-link">&larr; Volver a ${team?.name || 'Seleccion'}</a>

      <div class="player-header">
        <div class="player-avatar-lg" style="background: linear-gradient(135deg, ${posColor}44, ${posColor}11); border: 2px solid ${posColor};">
          <span>${initials}</span>
        </div>
        <div class="player-header-info">
          <h1 class="player-header-name">${player.name}</h1>
          <div class="player-header-meta">
            <span style="color: ${posColor}; font-weight: 600;">${POSITION_FULL[player.position] || player.position}</span>
            ${player.number ? `<span>#${player.number}</span>` : ''}
            ${player.age ? `<span>${player.age} anos</span>` : ''}
          </div>
          <div class="player-header-club">
            ${player.club ? `${player.club} (${player.clubCountry || ''})` : 'Sin club'}
          </div>
        </div>
      </div>

      <div class="player-section">
        <h3 class="player-section-title">ESTADISTICAS DE TEMPORADA</h3>
        <div class="player-stats-grid">
          ${statsGrid.map(s => `
            <div class="player-stat-card">
              <div class="player-stat-value">${s.value}</div>
              <div class="player-stat-label">${s.label}</div>
            </div>
          `).join('')}
        </div>
      </div>

      ${trophies.length > 0 ? `
      <div class="player-section">
        <h3 class="player-section-title">PALMARES</h3>
        <ul class="player-trophies-list">
          ${trophies.map(t => `<li>${t}</li>`).join('')}
        </ul>
      </div>
      ` : ''}

      ${player.style ? `
      <div class="player-section">
        <h3 class="player-section-title">ESTILO DE JUEGO</h3>
        <p class="player-style-text">${player.style}</p>
      </div>
      ` : ''}
    </section>
  `;
}
