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
        <div class="q-rules-card">
          <h2>📋 Reglas</h2>
          <ul>
            <li>Por cada partido, predice: <strong>ganador local</strong>, <strong>empate</strong> o <strong>ganador visita</strong></li>
            <li>Opcionalmente, ingresa el <strong>marcador exacto</strong> para puntos extra</li>
            <li><strong>3 puntos</strong> si atinas al resultado (quién gana o empate)</li>
            <li><strong>5 puntos</strong> si atinas al marcador exacto</li>
            <li>Puedes editar tus predicciones hasta que inicie cada partido</li>
            <li>Las fases se abren conforme avanza el torneo</li>
          </ul>
        </div>
      </div>
      <div id="q-auth-container">${renderQuinielaAuth()}</div>
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
