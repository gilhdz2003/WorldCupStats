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
      <div id="q-phase-tabs"><p class="q-loading">Cargando fases…</p></div>
      <div id="q-phase-points-bar"></div>
      <div id="q-progress-bar" class="q-progress-bar"></div>
      <div id="q-points-summary"></div>
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
  let openPhases = [];
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
      phase: pred.phase || null,
      status: pred.status || null,
    };
  }

  function isPredictionComplete(pred) {
    return pred?.predicted_result != null &&
      pred?.predicted_home_score != null &&
      pred?.predicted_away_score != null;
  }

  function updateCardCompleteness(card, matchId) {
    const pred = predictions[matchId];
    card.classList.toggle('q-prediction-card--incomplete',
      !!(pred?.predicted_result && (pred?.predicted_home_score == null || pred?.predicted_away_score == null)));
  }

  function computePointsSummary() {
    let totalPoints = 0, totalFinished = 0;
    let phasePoints = 0, phaseExact = 0, phaseCorrect = 0, phaseMiss = 0, phaseFinished = 0;

    for (const matchId in predictions) {
      const pred = predictions[matchId];
      if (pred.status !== 'finished') continue;

      const pts = pred.points_earned || 0;
      const phaseConfig = PHASE_POINTS[pred.phase] || { correct: 3, exact: 5 };

      totalPoints += pts;
      totalFinished++;

      if (pred.phase === currentPhase) {
        phasePoints += pts;
        phaseFinished++;
        if (pts === phaseConfig.exact) phaseExact++;
        else if (pts === phaseConfig.correct) phaseCorrect++;
        else phaseMiss++;
      }
    }

    return { totalPoints, totalFinished, phasePoints, phaseExact, phaseCorrect, phaseMiss, phaseFinished };
  }

  function renderPointsSummary() {
    const container = document.getElementById('q-points-summary');
    if (!container) return;

    const data = computePointsSummary();
    if (data.totalFinished === 0) { container.innerHTML = ''; return; }

    const phaseLabel = PHASE_LABELS[currentPhase] || currentPhase;

    container.innerHTML = `
      <div class="q-points-summary animate-fade-in">
        <div class="q-points-summary__total">
          <span class="q-points-summary__label">Total Acumulado</span>
          <span class="q-points-summary__value q-result-pts q-result-pts--exact">${data.totalPoints}</span>
          <span class="q-points-summary__sublabel">${data.totalFinished} partido${data.totalFinished !== 1 ? 's' : ''} evaluado${data.totalFinished !== 1 ? 's' : ''}</span>
        </div>
        <div class="q-points-summary__divider"></div>
        <div class="q-points-summary__phase">
          <span class="q-points-summary__label">${phaseLabel}</span>
          <span class="q-points-summary__value q-result-pts q-result-pts--correct">${data.phasePoints}</span>
          <div class="q-points-summary__breakdown">
            <span class="q-points-summary__exact">🎯 ${data.phaseExact} exacto${data.phaseExact !== 1 ? 's' : ''}</span>
            <span class="q-points-summary__sep">·</span>
            <span class="q-points-summary__correct-res">✅ ${data.phaseCorrect} resultado${data.phaseCorrect !== 1 ? 's' : ''}</span>
            <span class="q-points-summary__sep">·</span>
            <span class="q-points-summary__miss">❌ ${data.phaseMiss} fallado${data.phaseMiss !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    `;
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

      // Keep tabs synced in case the admin opened/closed phases since last load.
      if (Array.isArray(matchesData.open_phases)) {
        syncTabs(matchesData.open_phases);
      }

      // Authoritative source: authenticated predictions endpoint.
      (predictionsData.predictions || []).forEach(pred => {
        predictions[predictionKey(pred.match_id)] = normalizePrediction(pred);
      });

      // Fallback for deployments where quiniela-matches.php already includes predictions.
      matches.forEach(m => {
        const matchId = predictionKey(m.id);
        if (!predictions[matchId] && m.prediction) {
          const pred = normalizePrediction(m.prediction, matchId);
          pred.phase = m.phase;
          pred.status = m.status;
          predictions[matchId] = pred;
        }
      });

      renderPhase();
      renderPhasePointsBar();
      renderPointsSummary();
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
      const allFinished = dateMatches.every(m => m.status === 'finished');
      const collapsedClass = allFinished ? ' q-date-group--collapsed' : '';
      return `
        <div class="q-date-group${collapsedClass}" data-date="${date}">
          <button class="q-date-heading">${dateStr}<span class="q-date-toggle">${allFinished ? '▸' : '▾'}</span></button>
          <div class="q-date-matches">${dateMatches.map((m, i) => {
            const matchId = predictionKey(m.id);
            const stagger = i < 12 ? ` animate-slide-up stagger-${(i % 4) + 1}` : '';
            return `<div class="${stagger}">${renderPredictionCard(m, predictions[matchId], modified.has(matchId), PHASE_POINTS[currentPhase])}</div>`;
          }).join('')}</div>
        </div>
      `;
    }).join('');

    // Bind prediction card events
    bindCardEvents();

    // Bind collapsible date group toggles
    bindDateGroupToggles();

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
          updateCardCompleteness(card, matchId);
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

            // Auto-sync result button from scores when both are filled
            const hs = predictions[matchId].predicted_home_score;
            const as = predictions[matchId].predicted_away_score;
            if (hs != null && as != null) {
              const derived = hs > as ? 'home' : hs < as ? 'away' : 'draw';
              predictions[matchId].predicted_result = derived;
              card.querySelectorAll('.q-option').forEach(b => {
                b.classList.toggle('q-option--selected', b.dataset.result === derived);
              });
            }

            modified.add(matchId);
            updateCardCompleteness(card, matchId);
            updateSaveButton();
          });
        }
      });

      // Initialize completeness for cards with pre-existing predictions
      updateCardCompleteness(card, matchId);
    });
  }

  function bindDateGroupToggles() {
    document.querySelectorAll('.q-date-heading').forEach(heading => {
      heading.addEventListener('click', () => {
        const group = heading.closest('.q-date-group');
        group.classList.toggle('q-date-group--collapsed');
        const toggle = heading.querySelector('.q-date-toggle');
        if (toggle) toggle.textContent = group.classList.contains('q-date-group--collapsed') ? '▸' : '▾';
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

    // Validate: all predictions must have result + both scores
    const incomplete = Array.from(modified).filter(id => !isPredictionComplete(predictions[id]));
    if (incomplete.length > 0) {
      status.textContent = `⚠️ Ingresa el marcador en ${incomplete.length} predicción(es)`;
      incomplete.forEach(id => {
        const c = document.querySelector(`[data-match-id="${id}"]`);
        if (c) { c.classList.add('q-prediction-card--incomplete'); c.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      });
      btn.disabled = false;
      btn.textContent = '💾 Guardar Predicciones';
      return;
    }

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

  // Sync phase tabs with server-side phase state.
  // Renders only open phases as enabled. If the active phase is no longer open,
  // jump to the first open one so the user never lands on a closed phase.
  function syncTabs(freshOpenPhases) {
    openPhases = Array.isArray(freshOpenPhases) ? freshOpenPhases : [];
    if (openPhases.length > 0 && !openPhases.includes(currentPhase)) {
      currentPhase = openPhases[0];
    }
    const container = document.getElementById('q-phase-tabs');
    if (container) {
      container.innerHTML = renderPhaseTabs(false, { openPhases, currentPhase });
    }
  }

  // Bootstrap: fetch which phases are open, render the tabs, then load the default phase.
  async function bootstrapTabs() {
    try {
      const data = await getMatches(); // sin phase → el response incluye open_phases
      syncTabs(data.open_phases || []);
    } catch (err) {
      // Fallback: legacy render (solo Fase de Grupos) para no dejar la UI vacía.
      const container = document.getElementById('q-phase-tabs');
      if (container) container.innerHTML = renderPhaseTabs();
    }
    loadPhaseData();
  }

  // Bootstrap initial state
  bootstrapTabs();
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
