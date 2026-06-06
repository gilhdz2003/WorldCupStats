import { isLoggedIn, getUser, login, register, getLeaderboard, logout } from '../quiniela-api.js';
import { renderQuinielaAuth } from '../components/QuinielaAuth.js';

export function QuinielaHome() {
  if (isLoggedIn()) {
    const user = getUser();
    return renderDashboard(user);
  }
  return renderLanding();
}

function renderLanding() {
  return `
    <section class="container q-section">
      <div class="q-hero">
        <h1 class="q-hero-title">🏆 QUINIELA Grupo MB MUNDIAL 2026</h1>
        <p class="q-hero-subtitle">Predice los resultados de cada partido y gana puntos. ¡Los mejores 3 se llevan premios!</p>
      </div>
      <div id="q-auth-container">${renderQuinielaAuth()}</div>
      <div class="q-prizes-rules-card q-landing-info">
        <div class="q-prizes-section">
          <h2 class="q-prizes-title">🏆 Premios</h2>
          <div class="q-prizes-tiers">
            <div class="q-prize-tier q-prize-tier--gold">
              <span class="q-prize-medal">🥇</span>
              <div class="q-prize-info">
                <strong>1° — 3° Lugar</strong>
                <span>Playera oficial + Trofeo miniatura</span>
              </div>
            </div>
            <div class="q-prize-tier q-prize-tier--silver">
              <span class="q-prize-medal">🥈</span>
              <div class="q-prize-info">
                <strong>4° — 5° Lugar</strong>
                <span>Balón oficial del Mundial 2026</span>
              </div>
            </div>
            <div class="q-prize-tier q-prize-tier--more">
              <span class="q-prize-medal">🎁</span>
              <div class="q-prize-info">
                <strong>Más premios</strong>
                <span>Por anunciar</span>
              </div>
            </div>
          </div>
        </div>
        <div class="q-rules-divider"></div>
        <div class="q-rules-collapsible" style="animation: none;">
          <ul class="q-rules-list">
            <li>Por cada partido, predice: <strong>ganador local</strong>, <strong>empate</strong> o <strong>ganador visita</strong></li>
            <li>Ingresa el <strong>marcador exacto</strong> para obtener puntos bonus sobre el resultado</li>
            <li>Puedes editar tus predicciones <strong>hasta que inicie cada partido</strong></li>
          </ul>
          <div class="q-rules-subsection">
            <h3>📈 Puntos por Fase (escalonados)</h3>
            <div class="q-points-table">
              <div class="q-points-row q-points-header">
                <span>Fase</span><span>Resultado</span><span>MARCADOR</span>
              </div>
              <div class="q-points-row"><span>Grupos</span><strong>3</strong><strong>5</strong></div>
              <div class="q-points-row"><span>Ronda de 32</span><strong>4</strong><strong>7</strong></div>
              <div class="q-points-row"><span>Octavos de Final</span><strong>5</strong><strong>10</strong></div>
              <div class="q-points-row"><span>Cuartos de Final</span><strong>7</strong><strong>14</strong></div>
              <div class="q-points-row"><span>Semifinal</span><strong>10</strong><strong>20</strong></div>
              <div class="q-points-row"><span>Final</span><strong>15</strong><strong>30</strong></div>
            </div>
          </div>
          <div class="q-rules-subsection">
            <h3>⚖️ Criterios de Desempate</h3>
            <ol class="q-tiebreaker-list">
              <li>Mayor número de <strong>marcadores exactos</strong></li>
              <li>Mayor número de <strong>resultados correctos</strong></li>
              <li><strong>Antigüedad de registro</strong> (primer participante gana)</li>
            </ol>
          </div>
          <div class="q-rules-subsection">
            <h3>⏱️ Tiempo de Resultado</h3>
            <p>Todos los resultados se consideran en <strong>tiempo oficial de 90 minutos</strong>. No cuentan tiempos extras ni penales. Si un partido se define por penales, el resultado oficial para la quiniela es <strong>empate</strong>.</p>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderDashboard(user) {
  return `
    <section class="container q-section">
      <div class="q-dashboard">
        <h1 class="q-welcome">¡Hola, ${user.name}! 👋</h1>
        <div class="q-stats-grid">
          <a href="#/quiniela/predictions" class="q-stat-card">
            <span class="q-stat-icon">🎯</span>
            <span class="q-stat-label">Mis Predicciones</span>
          </a>
          <a href="#/quiniela/leaderboard" class="q-stat-card">
            <span class="q-stat-icon">📊</span>
            <span class="q-stat-label">Leaderboard</span>
          </a>
          ${user.is_admin ? `
          <a href="#/quiniela/admin" class="q-stat-card q-stat-card--admin">
            <span class="q-stat-icon">⚙️</span>
            <span class="q-stat-label">Panel Admin</span>
          </a>` : ''}
        </div>
        <div id="q-leaderboard-preview"></div>
        <div class="q-prizes-rules-card">
          <div class="q-prizes-section">
            <h2 class="q-prizes-title">🏆 Premios</h2>
            <div class="q-prizes-tiers">
              <div class="q-prize-tier q-prize-tier--gold">
                <span class="q-prize-medal">🥇</span>
                <div class="q-prize-info">
                  <strong>1° — 3° Lugar</strong>
                  <span>Playera oficial + Trofeo miniatura</span>
                </div>
              </div>
              <div class="q-prize-tier q-prize-tier--silver">
                <span class="q-prize-medal">🥈</span>
                <div class="q-prize-info">
                  <strong>4° — 5° Lugar</strong>
                  <span>Balón oficial del Mundial 2026</span>
                </div>
              </div>
              <div class="q-prize-tier q-prize-tier--more">
                <span class="q-prize-medal">🎁</span>
                <div class="q-prize-info">
                  <strong>Más premios</strong>
                  <span>Por anunciar</span>
                </div>
              </div>
            </div>
          </div>
          <div class="q-rules-divider"></div>
          <button id="q-toggle-rules" class="q-rules-toggle">
            <span>📋 Ver Reglas del Concurso</span>
            <span class="q-rules-arrow">▼</span>
          </button>
          <div id="q-rules-collapsible" class="q-rules-collapsible" hidden>
            <ul class="q-rules-list">
              <li>Por cada partido, predice: <strong>ganador local</strong>, <strong>empate</strong> o <strong>ganador visita</strong></li>
              <li>Opcionalmente, ingresa el <strong>marcador exacto</strong> para puntos extra</li>
              <li>Puedes editar tus predicciones <strong>hasta que inicie cada partido</strong></li>
            </ul>
            <div class="q-rules-subsection">
              <h3>📈 Puntos por Fase (escalonados)</h3>
              <div class="q-points-table">
                <div class="q-points-row q-points-header">
                  <span>Fase</span><span>Resultado</span><span>MARCADOR</span>
                </div>
                <div class="q-points-row"><span>Grupos</span><strong>3</strong><strong>5</strong></div>
                <div class="q-points-row"><span>Ronda de 32</span><strong>4</strong><strong>7</strong></div>
                <div class="q-points-row"><span>Octavos de Final</span><strong>5</strong><strong>10</strong></div>
                <div class="q-points-row"><span>Cuartos de Final</span><strong>7</strong><strong>14</strong></div>
                <div class="q-points-row"><span>Semifinal</span><strong>10</strong><strong>20</strong></div>
                <div class="q-points-row"><span>Final</span><strong>15</strong><strong>30</strong></div>
              </div>
            </div>
            <div class="q-rules-subsection">
              <h3>⚖️ Criterios de Desempate</h3>
              <ol class="q-tiebreaker-list">
                <li>Mayor número de <strong>marcadores exactos</strong></li>
                <li>Mayor número de <strong>resultados correctos</strong></li>
                <li><strong>Antigüedad de registro</strong> (primer participante gana)</li>
              </ol>
            </div>
            <div class="q-rules-subsection">
              <h3>⏱️ Tiempo de Resultado</h3>
              <p>Todos los resultados se consideran en <strong>tiempo oficial de 90 minutos</strong>. No cuentan tiempos extras ni penales. Si un partido se define por penales, el resultado oficial para la quiniela es <strong>empate</strong>.</p>
            </div>
          </div>
        </div>
        <button id="q-logout-btn" class="q-btn q-btn--secondary">Cerrar Sesión</button>
      </div>
    </section>
  `;
}

export function initQuinielaHome() {
  // Bind auth form events
  const container = document.getElementById('q-auth-container');
  if (container) bindAuthForms(container);

  // Bind dashboard events
  const logoutBtn = document.getElementById('q-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await logout();
      window.location.hash = '#/quiniela';
    });
    loadLeaderboardPreview();
  }

  // Bind rules toggle
  const toggleBtn = document.getElementById('q-toggle-rules');
  const rulesPanel = document.getElementById('q-rules-collapsible');
  if (toggleBtn && rulesPanel) {
    toggleBtn.addEventListener('click', () => {
      const isHidden = rulesPanel.hidden;
      rulesPanel.hidden = !isHidden;
      toggleBtn.querySelector('.q-rules-arrow').textContent = isHidden ? '▲' : '▼';
      toggleBtn.querySelector('span').textContent = isHidden
        ? '📋 Ocultar Reglas del Concurso'
        : '📋 Ver Reglas del Concurso';
    });
  }
}

function bindAuthForms(container) {
  // Tab switching
  const tabs = container.querySelectorAll('.q-auth-tab');
  const panels = container.querySelectorAll('.q-auth-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('q-auth-tab--active'));
      tab.classList.add('q-auth-tab--active');
      const target = tab.dataset.panel;
      panels.forEach(p => p.classList.toggle('q-auth-panel--active', p.id === target));
    });
  });

  // Forgot PIN link
  const forgotLink = container.querySelector('#q-forgot-pin');
  if (forgotLink) {
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      const loginForm = container.querySelector('#q-login-form');
      const msg = loginForm?.querySelector('.q-form-msg');
      if (msg) msg.innerHTML = '📱 <strong>Contacta al admin</strong> para resetear tu PIN.<br>Se te generará un código nuevo.';
    });
  }

  // Register form (single step: name + email → show PIN)
  const regForm = container.querySelector('#q-register-form');
  if (regForm) {
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = regForm.querySelector('.q-form-msg');
      const name = regForm.querySelector('#q-reg-name').value.trim();
      const email = regForm.querySelector('#q-reg-email').value.trim();
      if (!name || !email) { msg.textContent = 'Nombre y email requeridos'; return; }
      try {
        msg.textContent = 'Registrando...';
        const res = await register(name, email);
        // Replace the entire form with PIN success display
        const formContainer = regForm.closest('.q-auth-panel') || regForm;
        formContainer.innerHTML = `
          <div class="q-pin-success">
            <h3>✅ ¡Registro exitoso!</h3>
            <p class="q-pin-label">Tu código de acceso es:</p>
            <div class="q-pin-display">${res.pin}</div>
            <p class="q-pin-warning">⚠️ GUARDA ESTE CÓDIGO. No se vuelve a mostrar.</p>
            <button class="q-btn q-btn--primary q-btn--full" id="q-go-login">Ir a Iniciar Sesión →</button>
          </div>
        `;
        document.getElementById('q-go-login').addEventListener('click', () => {
          const loginTab = container.querySelector('[data-panel="q-login-panel"]');
          if (loginTab) loginTab.click();
          const loginEmail = container.querySelector('#q-login-email');
          if (loginEmail) loginEmail.value = email;
        });
      } catch (err) { msg.textContent = err.message; }
    });
  }

  // Login form
  const loginForm = container.querySelector('#q-login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = loginForm.querySelector('.q-form-msg');
      const email = loginForm.querySelector('#q-login-email').value.trim();
      const pin = loginForm.querySelector('#q-login-pin').value.trim();
      if (!email || !pin) { msg.textContent = 'Email y PIN requeridos'; return; }
      try {
        msg.textContent = 'Iniciando sesión...';
        const res = await login(email, pin);
        if (res.ok) {
          // Full page reload to show dashboard
          window.location.reload();
        } else {
          msg.textContent = res.error || 'Credenciales incorrectas';
        }
      } catch (err) { msg.textContent = err.message; }
    });
  }
}

async function loadLeaderboardPreview() {
  const container = document.getElementById('q-leaderboard-preview');
  if (!container) return;
  try {
    const data = await getLeaderboard('all');
    if (data.ok && data.leaderboard?.length) {
      const top5 = data.leaderboard.slice(0, 5);
      container.innerHTML = `
        <h2 class="q-section-title">📊 Top 5 Leaderboard</h2>
        <div class="q-leaderboard-preview-list">
          ${top5.map((u, i) => `
            <div class="q-leader-preview-row">
              <span class="q-leader-preview-rank">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
              <span class="q-leader-preview-name">${u.name}</span>
              <span class="q-leader-preview-pts">${u.total_points} pts</span>
            </div>
          `).join('')}
        </div>
        <a href="#/quiniela/leaderboard" class="q-link">Ver leaderboard completo →</a>
      `;
    }
  } catch (e) {
    container.innerHTML = '<p class="q-muted">Leaderboard disponible cuando inicie el torneo</p>';
  }
}
