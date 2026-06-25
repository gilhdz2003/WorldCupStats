const PHASES = [
  { key: 'groups', label: 'Fase de Grupos', icon: '🌍' },
  { key: 'round_of_32', label: 'Ronda de 32', icon: '⚽' },
  { key: 'round_of_16', label: 'Octavos de Final', icon: '🏆' },
  { key: 'quarterfinals', label: 'Cuartos de Final', icon: '🏆' },
  { key: 'semifinals', label: 'Semifinal', icon: '🥇' },
  { key: 'final', label: 'Final', icon: '👑' },
];

// withAll: includes "all" option for leaderboard view
// options.openPhases: array of phase keys currently open (is_open = 1). When provided,
//   only those tabs are enabled; the rest are disabled. When omitted, falls back to
//   legacy behavior (only the first phase active, rest disabled) for callers like the
//   leaderboard that want all phases reachable.
// options.currentPhase: phase key to mark as active.
export function renderPhaseTabs(withAll = false, options = {}) {
  const { openPhases = null, currentPhase = null } = options;
  const gated = Array.isArray(openPhases);
  // "Todos" is active by default in legacy (leaderboard) mode; in gated mode only when explicitly selected.
  const allActive = gated ? currentPhase === 'all' : true;

  return `
    <div class="q-phase-tabs">
      ${withAll ? `<button class="q-phase-tab${allActive ? ' q-phase-tab--active' : ''}" data-phase="all">🏆 Todos</button>` : ''}
      ${PHASES.map((p, i) => {
        let stateClass;
        if (gated) {
          // Tab is enabled if its phase is open OR it is the currently selected phase
          // (so the active tab never renders as disabled mid-session).
          const enabled = openPhases.includes(p.key) || p.key === currentPhase;
          stateClass = enabled
            ? (currentPhase === p.key ? ' q-phase-tab--active' : '')
            : ' q-phase-tab--disabled';
        } else {
          // Legacy: first phase active, rest disabled.
          stateClass = !withAll && i === 0 ? ' q-phase-tab--active' : ' q-phase-tab--disabled';
        }
        return `
        <button class="q-phase-tab${stateClass}" data-phase="${p.key}">
          ${p.icon} ${p.label}
        </button>
      `;
      }).join('')}
    </div>
  `;
}
