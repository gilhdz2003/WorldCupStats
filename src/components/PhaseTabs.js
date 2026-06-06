const PHASES = [
  { key: 'groups', label: 'Fase de Grupos', icon: '🌍' },
  { key: 'round_of_32', label: 'Ronda de 32', icon: '⚽' },
  { key: 'round_of_16', label: 'Octavos de Final', icon: '🏆' },
  { key: 'quarterfinals', label: 'Cuartos de Final', icon: '🏆' },
  { key: 'semifinals', label: 'Semifinal', icon: '🥇' },
  { key: 'final', label: 'Final', icon: '👑' },
];

// withAll: includes "all" option for leaderboard view
export function renderPhaseTabs(withAll = false) {
  return `
    <div class="q-phase-tabs">
      ${withAll ? '<button class="q-phase-tab q-phase-tab--active" data-phase="all">🏆 Todos</button>' : ''}
      ${PHASES.map((p, i) => `
        <button class="q-phase-tab${!withAll && i === 0 ? ' q-phase-tab--active' : ' q-phase-tab--disabled'}" data-phase="${p.key}">
          ${p.icon} ${p.label}
        </button>
      `).join('')}
    </div>
  `;
}
