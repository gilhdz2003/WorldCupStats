import { isLoggedIn, getUser, getLeaderboard } from '../quiniela-api.js';
import { renderLeaderboardTable } from '../components/LeaderboardTable.js';
import { renderPhaseTabs } from '../components/PhaseTabs.js';

export function QuinielaLeaderboard() {
  return `
    <section class="container q-section">
      <div class="q-page-header">
        <h1 class="q-page-title">📊 Leaderboard</h1>
        <a href="#/quiniela" class="q-btn q-btn--secondary q-btn-back">🏠 Quiniela</a>
      </div>
      <div id="q-lb-phase-tabs">${renderPhaseTabs(true)}</div>
      <div id="q-leaderboard-table"><p class="q-loading">Cargando...</p></div>
    </section>
  `;
}

export function initQuinielaLeaderboard() {
  const self = getUser();

  const tabsContainer = document.getElementById('q-lb-phase-tabs');
  if (tabsContainer) {
    tabsContainer.addEventListener('click', async (e) => {
      const tab = e.target.closest('.q-phase-tab');
      if (!tab) return;
      tabsContainer.querySelectorAll('.q-phase-tab').forEach(t => t.classList.remove('q-phase-tab--active'));
      tab.classList.add('q-phase-tab--active');
      await loadLeaderboard(tab.dataset.phase || 'all');
    });
  }

  async function loadLeaderboard(phase = 'all') {
    const container = document.getElementById('q-leaderboard-table');
    if (!container) return;
    container.innerHTML = '<p class="q-loading">Cargando...</p>';
    try {
      const data = await getLeaderboard(phase);
      if (data.ok && data.leaderboard) {
        container.innerHTML = renderLeaderboardTable(data.leaderboard, self?.id);
      } else {
        container.innerHTML = '<p class="q-muted">No hay datos aún.</p>';
      }
    } catch (err) {
      container.innerHTML = `<p class="q-error">Error: ${err.message}</p>`;
    }
  }

  loadLeaderboard('all');
}
