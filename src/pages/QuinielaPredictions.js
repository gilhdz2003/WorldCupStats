import { isLoggedIn, getUser, getMatches, getMyPredictions, savePredictions } from '../quiniela-api.js';
import { renderPredictionCard } from '../components/PredictionCard.js';
import { renderPhaseTabs } from '../components/PhaseTabs.js';

const PHASE_LABELS = {
  groups: 'Fase de Grupos',
  round_of_32: 'Ronda de 32',
  round_of_16: 'Octavos de Final',
  quarterfinals: 'Cuartos de Final',
  semifinals: 'Semifinal',
  final: 'Final'
};

const PHASE_POINTS = {
  groups:       { correct: 3, exact: 5 },
  round_of_32:  { correct: 4, exact: 7 },
  round_of_16:  { correct: 5, exact: 10 },
  quarterfinals: { correct: 7, exact: 14 },
  semifinals:   { correct: 10, exact: 20 },
  final:        { correct: 15, exact: 30 },
};

export function QuinielaPredictions() {
  if (!isLoggedIn()) {
    return `<section class="container q-section"><div class="q-login-prompt">
      <h2>Inicia sesión para hacer tus predicciones</h2>
      <a href="#/quiniela" class="q-btn q-btn--primary">Ir a Registro</a>
    </div></section>`;
  }

  return `
    <section class="container q-section">
      <div class="q-page-header">
        <h1 class="q-page-title">🎯 Mis Predicciones</h1>
        <a href="#/quiniela" class="q-btn q-btn--secondary q-btn-back">🏠 Quiniela</a>
      </div>
      <div id="q-phase-tabs">${renderPhaseTabs()}</div>
      <div id="q-phase-points-bar"></div>
      <div id="q-progress-bar" class="q-progress-bar"></div>
      <div id="q-predictions-list"></div>
      <div id="q-save-bar" class="q-save-bar">
        <span id="q-save-status"></span>
        <button id="q-save-btn" class="q-btn q-btn--primary">💾 Guardar Predicciones</button>
      </div>
    </section>
  `;
}

export function initQuinielaPredictions() {
  let currentPhase = 'groups';
  let matches = [];
  let predictions = {};
  let modified = new Set();

  function predictionKey(matchId) {
    return String(matchId);
  }

  function normalizePrediction(pred, matchId = pred.match_id) {
    return {
      match_id: predictionKey(matchId),
      predicted_result: pred.predicted_result,
      predicted_home_score: pred.predicted_home_score,
      predicted_away_score: pred.predicted_away_score,
      points_earned: pred.points_earned,
    };
  }

  // Bind phase tabs
  const tabsContainer = document.getElementById('q-phase-tabs');
  if (tabsContainer) {
    tabsContainer.addEventListener('click', (e) => {
      const tab = e.target.closest('.q-phase-tab');
      if (!tab || tab.classList.contains('q-phase-tab--disabled')) return;
      currentPhase = tab.dataset.phase;
      // Update active tab
      tabsContainer.querySelectorAll('.q-phase-tab').forEach(t => t.classList.remove('q-phase-tab--active'));
      tab.classList.add('q-phase-tab--active');
      loadPhaseData();
    });
  }

  // Bind save button
  const saveBtn = document.getElementById('q-save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveAllPredictions);
  }

  function renderPhasePointsBar() {
    const container = document.getElementById('q-phase-points-bar');
    if (!container) return;
    const pts = PHASE_POINTS[currentPhase] || { correct: 3, exact: 5 };
    const label = PHASE_LABELS[currentPhase] || currentPhase;
    container.innerHTML = `
      <div class="q-phase-points-bar">
        <span class="q-phase-points-label">${label}:</span>
        <span>Resultado <strong>${pts.correct}</strong> pts</span>
        <span class="q-phase-points-sep">·</span>
        <span>Marcador exacto <strong>${pts.exact - pts.correct}</strong> pts extra</span>
      </div>
    `;
  }

  async function loadPhaseData() {
    try {
      const [matchesData, predictionsData] = await Promise.all([
        getMatches(currentPhase),
        getMyPredictions(),
      ]);

      matches = matchesData.matches || [];
      predictions = {};

      // Authoritative source: authenticated predictions endpoint.
      (predictionsData.predictions || []).forEach(pred => {
        predictions[predictionKey(pred.match_id)] = normalizePrediction(pred);
      });

      // Fallback for deployments where quiniela-matches.php already includes predictions.
      matches.forEach(m => {
        const matchId = predictionKey(m.id);
        if (!predictions[matchId] && m.prediction) {
          predictions[matchId] = normalizePrediction(m.prediction, matchId);
        }
      });

      renderPhase();
      renderPhasePointsBar();
    } catch (err) {
      document.getElementById('q-predictions-list').innerHTML = `<p class="q-error">Error cargando datos: ${err.message}</p>`;
    }
  }

  function renderPhase() {
    const list = document.getElementById('q-predictions-list');
    const progressBar = document.getElementById('q-progress-bar');

    // Group matches by date
    const byDate = {};
    matches.forEach(m => {
      const d = m.match_date;
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push(m);
    });

    // Count predicted
    const phaseMatches = matches.filter(m => m.phase === currentPhase);
    const predictedCount = phaseMatches.filter(m => predictions[predictionKey(m.id)]?.predicted_result).length;
    const total = phaseMatches.length;

    const progressPct = total > 0 ? Math.round((predictedCount / total) * 100) : 0;
    if (progressBar) {
      progressBar.innerHTML = `
        <div class="q-progress-text">Has predicho <strong>${predictedCount}</strong> de <strong>${total}</strong> partidos</div>
        <div class="q-progress-track"><div class="q-progress-fill" style="width:${progressPct}%"></div></div>
      `;
    }

    if (matches.length === 0) {
      list.innerHTML = '<p class="q-muted">No hay partidos para esta fase aún.</p>';
      return;
    }

    list.innerHTML = Object.entries(byDate).map(([date, dateMatches]) => {
      const dateObj = new Date(date + 'T12:00:00');
      const dateStr = dateObj.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
      return `
        <div class="q-date-group">
          <h3 class="q-date-heading">${dateStr}</h3>
          ${dateMatches.map((m, i) => {
            const matchId = predictionKey(m.id);
            const stagger = i < 12 ? ` animate-slide-up stagger-${(i % 4) + 1}` : '';
            return `<div class="${stagger}">${renderPredictionCard(m, predictions[matchId], modified.has(matchId), PHASE_POINTS[currentPhase])}</div>`;
          }).join('')}
        </div>
      `;
    }).join('');

    // Bind prediction card events
    bindCardEvents();

    // Trigger mini confetti on exact score results
    triggerExactConfetti();
  }

  function bindCardEvents() {
    document.querySelectorAll('.q-prediction-card').forEach(card => {
      const matchId = card.dataset.matchId;

      card.querySelectorAll('.q-option').forEach(btn => {
        btn.addEventListener('click', () => {
          if (card.classList.contains('q-prediction-card--locked')) return;
          card.querySelectorAll('.q-option').forEach(b => b.classList.remove('q-option--selected'));
          btn.classList.add('q-option--selected');
          // Store locally
          if (!predictions[matchId]) predictions[matchId] = { match_id: matchId };
          predictions[matchId].predicted_result = btn.dataset.result;
          modified.add(matchId);
          updateSaveButton();
        });
      });

      // Score inputs
      const homeInput = card.querySelector('.q-score-home');
      const awayInput = card.querySelector('.q-score-away');
      [homeInput, awayInput].forEach(input => {
        if (input) {
          input.addEventListener('input', () => {
            if (!predictions[matchId]) predictions[matchId] = { match_id: matchId };
            predictions[matchId].predicted_home_score = homeInput?.value ? parseInt(homeInput.value) : null;
            predictions[matchId].predicted_away_score = awayInput?.value ? parseInt(awayInput.value) : null;
            modified.add(matchId);
            updateSaveButton();
          });
        }
      });
    });
  }

  function updateSaveButton() {
    const btn = document.getElementById('q-save-btn');
    const status = document.getElementById('q-save-status');
    const count = modified.size;
    if (btn) btn.disabled = count === 0;
    if (status && count > 0) status.textContent = `${count} predicción(es) sin guardar`;
    else if (status) status.textContent = 'Todo guardado ✓';
  }

  async function saveAllPredictions() {
    const btn = document.getElementById('q-save-btn');
    const status = document.getElementById('q-save-status');
    if (!btn) return;

    btn.disabled = true;
    btn.textContent = 'Guardando...';
    status.textContent = '';

    const toSave = Array.from(modified).map(matchId => ({
      match_id: matchId,
      predicted_result: predictions[matchId].predicted_result,
      predicted_home_score: predictions[matchId].predicted_home_score,
      predicted_away_score: predictions[matchId].predicted_away_score
    }));

    try {
      const res = await savePredictions(toSave);
      if (res.ok) {
        status.textContent = `✅ ${res.saved} predicción(es) guardada(s)`;
        modified.clear();
        updateSaveButton();
      } else {
        status.textContent = `❌ ${res.error || 'Error al guardar'}`;
      }
    } catch (err) {
      status.textContent = `❌ ${err.message}`;
    }

    btn.disabled = false;
    btn.textContent = '💾 Guardar Predicciones';
  }

  // Load initial phase
  loadPhaseData();
}

/**
 * Mini confetti burst on exact score prediction cards.
 * Creates 12 small golden particles that burst outward from the result section,
 * then auto-cleans after animation completes.
 */
function triggerExactConfetti() {
  const exactSections = document.querySelectorAll('.q-result-section--exact');
  exactSections.forEach(section => {
    // Skip if already confetti'd this session
    if (section.querySelector('.q-confetti-container')) return;

    const container = document.createElement('div');
    container.className = 'q-confetti-container';
    section.appendChild(container);

    const colors = ['#D4AF37', '#FFD700', '#FFC107', '#FFEB3B', '#FFF8E1', '#E8B923'];
    const particleCount = 12;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      const angle = (i / particleCount) * Math.PI * 2 + (Math.random() * 0.5 - 0.25);
      const distance = 25 + Math.random() * 20;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance - 10; // bias upward
      const isSparkle = i % 3 === 0;

      particle.className = `q-confetti-particle${isSparkle ? ' q-confetti-particle--sparkle' : ''}`;
      particle.style.setProperty('--q-confetti-x', `${x}px`);
      particle.style.setProperty('--q-confetti-y', `${y}px`);
      particle.style.setProperty('--q-confetti-color', colors[i % colors.length]);
      particle.style.setProperty('--q-confetti-delay', `${Math.random() * 0.15}s`);
      particle.style.setProperty('--q-confetti-dur', `${0.5 + Math.random() * 0.3}s`);
      particle.style.setProperty('--q-confetti-size', `${4 + Math.random() * 4}px`);
      particle.style.backgroundColor = colors[i % colors.length];
      container.appendChild(particle);
    }

    // Auto-cleanup after animations complete (~1s)
    setTimeout(() => container.remove(), 1200);
  });
}
