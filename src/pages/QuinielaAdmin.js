import { isLoggedIn, getUser, adminGetParticipants, adminGetPhases, adminTogglePhase, adminSetScore, adminExport, adminExportPredictions, adminResetPin, adminResetMatch, adminGetConfig, adminToggleLock, adminToggleRegistration, adminToggleEspecial, adminExportEspecial, getMatches } from '../quiniela-api.js';

export function QuinielaAdmin() {
  const user = getUser();
  if (!user || !user.is_admin) {
    return `<section class="container q-section">
      <h1>Acceso Denegado</h1>
      <p>Solo los administradores pueden ver esta página.</p>
      <a href="#/quiniela" class="q-btn q-btn--primary">Volver</a>
    </section>`;
  }

  return `
    <section class="container q-section">
      <h1 class="q-page-title">⚙️ Panel de Administración</h1>

      <div class="q-admin-section">
        <h2>🔒 Control Global</h2>
        <div id="q-admin-global-lock"><p class="q-loading">Cargando...</p></div>
      </div>

      <div class="q-admin-section">
        <h2>🎛️ Control de Fases</h2>
        <div id="q-admin-phases"><p class="q-loading">Cargando...</p></div>
      </div>

      <div class="q-admin-section">
        <h2>📝 Marcador Manual</h2>
        <div id="q-admin-score-form" class="q-admin-score-form">
          <div class="q-form-row">
            <label>Fase:</label>
            <select id="q-admin-phase-select">
              <option value="groups">Fase de Grupos</option>
              <option value="round_of_32">Ronda de 32</option>
              <option value="round_of_16">Octavos de Final</option>
              <option value="quarterfinals">Cuartos de Final</option>
              <option value="semifinals">Semifinal</option>
              <option value="final">Final</option>
            </select>
          </div>
          <div class="q-form-row">
            <label>Partido:</label>
            <select id="q-admin-match-select"><option value="">Cargando partidos...</option></select>
          </div>
          <div class="q-form-row">
            <label>Score Local:</label>
            <input type="number" id="q-admin-home-score" min="0" max="99" value="0">
          </div>
          <div class="q-form-row">
            <label>Score Visita:</label>
            <input type="number" id="q-admin-away-score" min="0" max="99" value="0">
          </div>
          <button id="q-admin-set-score" class="q-btn q-btn--primary">Actualizar Marcador</button>
          <button id="q-admin-reset-match" class="q-btn q-btn--warning" style="margin-left: var(--spacing-sm);">🔄 Resetear Marcador</button>
          <span id="q-admin-score-msg"></span>
        </div>
      </div>

      <div class="q-admin-section">
        <h2>👥 Participantes</h2>
        <div id="q-admin-participants"><p class="q-loading">Cargando...</p></div>
      </div>

      <div class="q-admin-section">
        <h2>⭐ Liga Especial</h2>
        <div id="q-admin-especial"><p class="q-loading">Cargando...</p></div>
      </div>

      <div class="q-admin-section">
        <h2>📤 Exportar</h2>
        <button id="q-admin-export" class="q-btn q-btn--secondary">📊 Descargar Leaderboard CSV</button>
        <div style="margin-top: var(--spacing-md);">
          <h3 style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: var(--spacing-sm);">💾 Backup de Predicciones</h3>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: var(--spacing-sm);">CSV con todas las predicciones de todos los usuarios. Descarga diaria para respaldo.</p>
          <button id="q-admin-export-predictions" class="q-btn q-btn--secondary">📋 Backup Predicciones (Todas)</button>
        </div>
      </div>
    </section>
  `;
}

export function initQuinielaAdmin() {
  loadGlobalLock();
  loadPhases();
  loadParticipants();
  loadEspecial();
  loadMatchSelect();
  bindAdminEvents();
}

async function loadGlobalLock() {
  const container = document.getElementById('q-admin-global-lock');
  if (!container) return;
  try {
    const data = await adminGetConfig();
    if (!data.ok) { container.innerHTML = '<p class="q-error">Error cargando config</p>'; return; }
    const predLocked = data.predictions_locked;
    const regLocked = data.registration_locked;
    container.innerHTML = `
      <div class="q-admin-global-lock-row">
        <span class="q-admin-lock-label">Predicciones:</span>
        <label class="q-toggle">
          <input type="checkbox" id="q-global-lock-toggle" ${predLocked ? 'checked' : ''}>
          <span class="q-toggle-slider"></span>
        </label>
        <span class="q-admin-lock-status ${predLocked ? 'q-status-closed' : 'q-status-open'}">${predLocked ? '🔒 BLOQUEADAS' : '✅ ABIERTAS'}</span>
      </div>
      <p class="q-lock-warning" style="display:${predLocked ? 'block' : 'none'}">Nadie puede enviar ni editar predicciones mientras este switch esté activo.</p>
      <div class="q-admin-global-lock-row">
        <span class="q-admin-lock-label">Registros:</span>
        <label class="q-toggle">
          <input type="checkbox" id="q-reg-lock-toggle" ${regLocked ? 'checked' : ''}>
          <span class="q-toggle-slider"></span>
        </label>
        <span class="q-admin-lock-status ${regLocked ? 'q-status-closed' : 'q-status-open'}" id="q-reg-lock-status">${regLocked ? '🔒 CERRADOS' : '✅ ABIERTOS'}</span>
      </div>
      <p class="q-lock-warning" style="display:${regLocked ? 'block' : 'none'}">Nadie podrá registrarse como nuevo participante.</p>
    `;

    // Predictions toggle
    document.getElementById('q-global-lock-toggle').addEventListener('change', async () => {
      const isLocked = document.getElementById('q-global-lock-toggle').checked;
      const confirmMsg = isLocked
        ? '⚠️ ¿Bloquear TODAS las predicciones?\n\nNadie podrá enviar ni editar predicciones.'
        : '¿Desbloquear predicciones?\n\nLos usuarios podrán volver a predecir.';
      if (!confirm(confirmMsg)) {
        document.getElementById('q-global-lock-toggle').checked = !isLocked;
        return;
      }
      try {
        await adminToggleLock(isLocked);
        const statusEl = container.querySelector('#q-global-lock-toggle').closest('.q-admin-global-lock-row').querySelector('.q-admin-lock-status');
        const warning = container.querySelector('.q-lock-warning');
        statusEl.textContent = isLocked ? '🔒 BLOQUEADAS' : '✅ ABIERTAS';
        statusEl.className = `q-admin-lock-status ${isLocked ? 'q-status-closed' : 'q-status-open'}`;
        warning.style.display = isLocked ? 'block' : 'none';
      } catch (err) {
        alert('Error: ' + err.message);
        document.getElementById('q-global-lock-toggle').checked = !isLocked;
      }
    });

    // Registration toggle
    document.getElementById('q-reg-lock-toggle').addEventListener('change', async () => {
      const isLocked = document.getElementById('q-reg-lock-toggle').checked;
      const confirmMsg = isLocked
        ? '⚠️ ¿Cerrar registros?\n\nNadie podrá registrarse como nuevo participante.'
        : '¿Reabrir registros?\n\nNuevos participantes podrán registrarse.';
      if (!confirm(confirmMsg)) {
        document.getElementById('q-reg-lock-toggle').checked = !isLocked;
        return;
      }
      try {
        await adminToggleRegistration(isLocked);
        const statusEl = document.getElementById('q-reg-lock-status');
        const rows = container.querySelectorAll('.q-admin-global-lock-row');
        const warnings = container.querySelectorAll('.q-lock-warning');
        statusEl.textContent = isLocked ? '🔒 CERRADOS' : '✅ ABIERTOS';
        statusEl.className = `q-admin-lock-status ${isLocked ? 'q-status-closed' : 'q-status-open'}`;
        warnings[1].style.display = isLocked ? 'block' : 'none';
      } catch (err) {
        alert('Error: ' + err.message);
        document.getElementById('q-reg-lock-toggle').checked = !isLocked;
      }
    });
  } catch (err) {
    container.innerHTML = `<p class="q-error">${err.message}</p>`;
  }
}

async function loadPhases() {
  const container = document.getElementById('q-admin-phases');
  if (!container) return;
  try {
    const data = await adminGetPhases();
    if (!data.ok) { container.innerHTML = '<p class="q-error">Error cargando fases</p>'; return; }
    const phaseLabels = {
      groups: 'Fase de Grupos', round_of_32: 'Ronda de 32', round_of_16: 'Octavos de Final',
      quarterfinals: 'Cuartos de Final', semifinals: 'Semifinal', final: 'Final'
    };
    container.innerHTML = data.phases.map(p => `
      <div class="q-admin-phase-row">
        <span class="q-admin-phase-name">${phaseLabels[p.phase] || p.phase}</span>
        <label class="q-toggle">
          <input type="checkbox" data-phase="${p.phase}" ${p.is_open ? 'checked' : ''}>
          <span class="q-toggle-slider"></span>
        </label>
        <span class="q-admin-phase-status ${p.is_open ? 'q-status-open' : 'q-status-closed'}">${p.is_open ? 'ABIERTA' : 'CERRADA'}</span>
      </div>
    `).join('');

    // Bind toggles
    container.querySelectorAll('.q-toggle input').forEach(toggle => {
      toggle.addEventListener('change', async () => {
        const phase = toggle.dataset.phase;
        const isOpen = toggle.checked;
        try {
          await adminTogglePhase(phase, isOpen);
          const statusEl = toggle.closest('.q-admin-phase-row').querySelector('.q-admin-phase-status');
          statusEl.textContent = isOpen ? 'ABIERTA' : 'CERRADA';
          statusEl.className = `q-admin-phase-status ${isOpen ? 'q-status-open' : 'q-status-closed'}`;
        } catch (err) {
          alert('Error: ' + err.message);
          toggle.checked = !isOpen;
        }
      });
    });
  } catch (err) {
    container.innerHTML = `<p class="q-error">${err.message}</p>`;
  }
}

async function loadParticipants() {
  const container = document.getElementById('q-admin-participants');
  if (!container) return;
  try {
    const data = await adminGetParticipants();
    if (!data.ok) { container.innerHTML = '<p class="q-error">Error</p>'; return; }
    container.innerHTML = `
      <div class="q-table-wrapper">
        <table class="q-table">
          <thead><tr>
            <th>Nombre</th><th>Email</th><th>Puntos</th><th>Predicciones</th><th>Registro</th><th></th>
          </tr></thead>
          <tbody>
            ${data.participants.map(p => `
              <tr data-user-id="${p.id}">
                <td>${p.name}</td>
                <td>${p.email}</td>
                <td class="q-pts-cell">${p.total_points}</td>
                <td>${p.predictions_count}</td>
                <td>${p.created_at}</td>
                <td><button class="q-btn q-btn--sm q-btn--warning q-reset-pin-btn" data-user-id="${p.id}" data-user-name="${p.name}">🔑 Reset PIN</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <p class="q-muted">Total: ${data.participants.length} participantes</p>
    `;
  } catch (err) {
    container.innerHTML = `<p class="q-error">${err.message}</p>`;
  }
}

async function loadEspecial() {
  const container = document.getElementById('q-admin-especial');
  if (!container) return;
  try {
    const data = await adminGetParticipants();
    if (!data.ok) { container.innerHTML = '<p class="q-error">Error</p>'; return; }
    const especialCount = data.participants.filter(p => p.is_especial).length;
    container.innerHTML = `
      <p class="q-muted" style="margin-bottom: var(--spacing-sm);">Marca los participantes de la liga especial (privada).</p>
      <div class="q-especial-actions" style="margin-bottom: var(--spacing-md);">
        <div class="q-form-row" style="align-items: center; gap: var(--spacing-sm);">
          <label style="font-size: 0.85rem;">Fase:</label>
          <select id="q-especial-phase" style="font-size: 0.85rem; padding: 4px 8px;">
            <option value="all">Todas</option>
            <option value="groups">Fase de Grupos</option>
            <option value="round_of_32">Ronda de 32</option>
            <option value="round_of_16">Octavos de Final</option>
            <option value="quarterfinals">Cuartos de Final</option>
            <option value="semifinals">Semifinal</option>
            <option value="final">Final</option>
          </select>
          <button id="q-admin-export-especial" class="q-btn q-btn--primary q-btn--sm">📥 Descargar CSV Especial</button>
        </div>
        <p id="q-especial-count" class="q-muted" style="font-size: 0.8rem; margin-top: var(--spacing-xs);">${especialCount} participante(s) marcado(s)</p>
      </div>
      <div class="q-table-wrapper">
        <table class="q-table">
          <thead><tr>
            <th>⭐</th><th>Nombre</th><th>Email</th><th>Puntos</th>
          </tr></thead>
          <tbody>
            ${data.participants.map(p => `
              <tr data-user-id="${p.id}">
                <td><input type="checkbox" class="q-especial-toggle" data-user-id="${p.id}" ${p.is_especial ? 'checked' : ''}></td>
                <td>${p.name}</td>
                <td>${p.email}</td>
                <td class="q-pts-cell">${p.total_points}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Bind especial toggles
    container.querySelectorAll('.q-especial-toggle').forEach(cb => {
      cb.addEventListener('change', async () => {
        const userId = cb.dataset.userId;
        try {
          cb.disabled = true;
          await adminToggleEspecial(userId);
          // Browser already flipped the checkbox; server confirmed the toggle
          const newCount = container.querySelectorAll('.q-especial-toggle:checked').length;
          document.getElementById('q-especial-count').textContent = `${newCount} participante(s) marcado(s)`;
        } catch (err) {
          alert('Error: ' + err.message);
          cb.checked = !cb.checked; // revert on error
        } finally {
          cb.disabled = false;
        }
      });
    });

    // Bind export especial button
    document.getElementById('q-admin-export-especial')?.addEventListener('click', async () => {
      const btn = document.getElementById('q-admin-export-especial');
      const phase = document.getElementById('q-especial-phase').value;
      const originalText = btn.textContent;
      btn.textContent = 'Descargando...';
      btn.disabled = true;
      try {
        const res = await adminExportEspecial(phase);
        if (!res.ok) throw new Error('Error del servidor');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const phaseLabel = phase !== 'all' ? `-${phase}` : '';
        a.href = url; a.download = `liga-especial${phaseLabel}.csv`;
        a.click(); URL.revokeObjectURL(url);
      } catch (err) { alert('Error exportando: ' + err.message); }
      finally {
        btn.textContent = originalText;
        btn.disabled = false;
      }
    });
  } catch (err) {
    container.innerHTML = `<p class="q-error">${err.message}</p>`;
  }
}

async function loadMatchSelect() {
  const select = document.getElementById('q-admin-match-select');
  if (!select) return;
  try {
    const phaseSelect = document.getElementById('q-admin-phase-select');
    const phase = phaseSelect ? phaseSelect.value : 'groups';
    const data = await getMatches(phase);
    if (data.ok && data.matches) {
      select.innerHTML = '<option value="">-- Selecciona partido --</option>' +
        data.matches.map(m => `<option value="${m.id}" data-phase="${m.phase}">${m.match_date}: ${m.home_team} vs ${m.away_team}${m.status === 'finished' ? ' ✓' : ''}</option>`).join('');
    }
  } catch (err) {
    select.innerHTML = '<option>Error cargando</option>';
  }
}

function bindAdminEvents() {
  // Phase selector → reload match dropdown
  const phaseSelect = document.getElementById('q-admin-phase-select');
  if (phaseSelect) {
    phaseSelect.addEventListener('change', loadMatchSelect);
  }

  const setScoreBtn = document.getElementById('q-admin-set-score');
  if (setScoreBtn) {
    setScoreBtn.addEventListener('click', async () => {
      const matchId = document.getElementById('q-admin-match-select').value;
      const homeScore = parseInt(document.getElementById('q-admin-home-score').value);
      const awayScore = parseInt(document.getElementById('q-admin-away-score').value);
      const msg = document.getElementById('q-admin-score-msg');
      if (!matchId) { msg.textContent = 'Selecciona un partido'; return; }
      msg.textContent = 'Procesando...';
      try {
        const res = await adminSetScore(matchId, homeScore, awayScore);
        if (res.ok) {
          msg.textContent = `✅ ${res.scored} predicciones puntuadas`;
          loadMatchSelect(); // refresh
        } else {
          msg.textContent = `❌ ${res.error}`;
        }
      } catch (err) { msg.textContent = `❌ ${err.message}`; }
    });
  }

  // Reset match button (for validation testing)
  const resetBtn = document.getElementById('q-admin-reset-match');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      const matchId = document.getElementById('q-admin-match-select').value;
      const msg = document.getElementById('q-admin-score-msg');
      if (!matchId) { msg.textContent = 'Selecciona un partido'; return; }
      if (!confirm(`¿Resetear marcador del partido #${matchId}?\n\nEsto elimina el score, puntos y scoring log.`)) return;
      msg.textContent = 'Reseteando...';
      try {
        const res = await adminResetMatch(matchId);
        if (res.ok) {
          msg.textContent = `✅ Partido #${matchId} reseteado`;
          loadMatchSelect();
        } else {
          msg.textContent = `❌ ${res.error}`;
        }
      } catch (err) { msg.textContent = `❌ ${err.message}`; }
    });
  }

  const exportBtn = document.getElementById('q-admin-export');
  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      try {
        const res = await adminExport();
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'leaderboard-quiniela.csv';
        a.click(); URL.revokeObjectURL(url);
      } catch (err) { alert('Error exportando: ' + err.message); }
    });
  }

  // Backup de predicciones (todas)
  const exportPredsBtn = document.getElementById('q-admin-export-predictions');
  if (exportPredsBtn) {
    exportPredsBtn.addEventListener('click', async () => {
      const originalText = exportPredsBtn.textContent;
      exportPredsBtn.textContent = 'Descargando...';
      exportPredsBtn.disabled = true;
      try {
        const res = await adminExportPredictions();
        if (!res.ok) throw new Error('Error del servidor');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const today = new Date().toISOString().split('T')[0];
        a.href = url; a.download = `backup-predicciones-${today}.csv`;
        a.click(); URL.revokeObjectURL(url);
      } catch (err) { alert('Error exportando predicciones: ' + err.message); }
      finally {
        exportPredsBtn.textContent = originalText;
        exportPredsBtn.disabled = false;
      }
    });
  }

  // Reset PIN buttons (delegated from participants table)
  document.getElementById('q-admin-participants')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('.q-reset-pin-btn');
    if (!btn) return;
    const userId = btn.dataset.userId;
    const userName = btn.dataset.userName;
    if (!confirm(`Generar un nuevo PIN para ${userName}?\n\nEl usuario tendrá que volver a iniciar sesión.`)) return;
    try {
      btn.disabled = true;
      btn.textContent = '...';
      const res = await adminResetPin(userId);
      if (res.ok) {
        alert(`🔑 Nuevo PIN para ${res.user} (${res.email}):\n\n${res.pin}\n\nCópialo y envíalo por WhatsApp.`);
        btn.textContent = '✅ Enviado';
      }
    } catch (err) {
      alert('Error: ' + err.message);
      btn.disabled = false;
      btn.textContent = '🔑 Reset PIN';
    }
  });
}
