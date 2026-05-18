const POSITION_COLORS = {
  'GK': 'var(--accent-info)',
  'DF': 'var(--accent-success)',
  'MF': 'var(--accent-secondary)',
  'FW': 'var(--accent-danger)',
};

const POSITION_LABELS = {
  'GK': 'Portero',
  'DF': 'Defensa',
  'MF': 'Mediocampista',
  'FW': 'Delantero',
};

export function renderPlayerCard(player, size = 'sm') {
  const posColor = POSITION_COLORS[player.position] || 'var(--text-muted)';
  const posLabel = POSITION_LABELS[player.position] || player.position;
  const initials = player.name.split(' ').map(w => w[0]).slice(0, 2).join('');

  if (size === 'lg') {
    return `
      <a href="#/player/${player.id}" class="player-card player-card-lg">
        <div class="player-avatar" style="background: linear-gradient(135deg, ${posColor}33, ${posColor}11);">
          <span>${initials}</span>
        </div>
        <div class="player-card-info">
          <div class="player-card-name">${player.name}</div>
          <div class="player-card-position" style="color: ${posColor};">${posLabel}</div>
          <div class="player-card-club">${player.club || 'Sin club'}</div>
          <div class="player-card-stats-row">
            <span><strong>${player.stats?.games || 0}</strong> PJ</span>
            <span><strong>${player.stats?.goals || 0}</strong> G</span>
            <span><strong>${player.stats?.assists || 0}</strong> A</span>
          </div>
        </div>
      </a>
    `;
  }

  return `
    <a href="#/player/${player.id}" class="player-card">
      <div class="player-avatar" style="background: linear-gradient(135deg, ${posColor}33, ${posColor}11);">
        <span>${initials}</span>
      </div>
      <div class="player-card-name">${player.name}</div>
      <div class="player-card-position" style="color: ${posColor};">${player.position}</div>
      <div class="player-card-club">${player.club || ''}</div>
    </a>
  `;
}
