import { translateTeam } from '../data/team-names-es.js';

export function renderPredictionCard(match, prediction, isModified, phasePoints) {
  const isLocked = match.is_locked || match.status === 'finished';
  const isFinished = match.status === 'finished';
  const predicted = prediction?.predicted_result;
  const lockedClass = isLocked ? ' q-prediction-card--locked' : '';
  const hasResult = isFinished && match.home_score !== null;

  // Determine if user got points
  let resultBadge = '';
  if (hasResult && predicted) {
    const pts = prediction.points_earned || 0;
    if (pts > 0) {
      const badgeClass = (phasePoints && pts === phasePoints.exact) ? 'q-badge--exact' : 'q-badge--correct';
      resultBadge = `<span class="q-badge ${badgeClass}">+${pts}</span>`;
    } else {
      resultBadge = '<span class="q-badge q-badge--miss">0</span>';
    }
  }

  return `
    <div class="q-prediction-card${lockedClass}" data-match-id="${match.id}">
      <div class="q-pred-teams">
        <!-- Home team: flag + name + score input -->
        <div class="q-pred-team q-pred-team--home">
          <img src="${match.home_logo || `/logos/${match.home_abbr?.toLowerCase() || 'xxx'}.png`}" alt="" class="q-team-flag" onerror="this.style.display='none'">
          <div class="q-pred-team-info">
            <span class="q-pred-team-name">${translateTeam(match.home_team)}</span>
            ${!isLocked ? `
              <input type="number" class="q-score-input q-score-home" min="0" max="99" placeholder="-" value="${prediction?.predicted_home_score ?? ''}">
            ` : ''}
            ${hasResult ? `<span class="q-pred-score">${match.home_score}</span>` : ''}
          </div>
        </div>

        <!-- Center: option buttons OR locked display -->
        <div class="q-pred-center">
          ${!isLocked ? `
            <button class="q-option q-option--home ${predicted === 'home' ? 'q-option--selected' : ''}" data-result="home" title="Gana Local">🏠<span class="q-option-label">Local</span></button>
          ` : ''}
          ${!isLocked ? `
            <button class="q-option q-option--draw ${predicted === 'draw' ? 'q-option--selected' : ''}" data-result="draw" title="Empate">🤝<span class="q-option-label">Empate</span></button>
          ` : ''}
          ${!isLocked ? `
            <button class="q-option q-option--away ${predicted === 'away' ? 'q-option--selected' : ''}" data-result="away" title="Gana Visita">✈️<span class="q-option-label">Visita</span></button>
          ` : ''}
          ${isLocked ? (hasResult ? `${match.home_score} - ${match.away_score}` : '🔒') : ''}
          ${resultBadge}
        </div>

        <!-- Away team: score input + name + flag -->
        <div class="q-pred-team q-pred-team--away">
          <div class="q-pred-team-info">
            <span class="q-pred-team-name">${translateTeam(match.away_team)}</span>
            ${!isLocked ? `
              <input type="number" class="q-score-input q-score-away" min="0" max="99" placeholder="-" value="${prediction?.predicted_away_score ?? ''}">
            ` : ''}
            ${hasResult ? `<span class="q-pred-score">${match.away_score}</span>` : ''}
          </div>
          <img src="${match.away_logo || `/logos/${match.away_abbr?.toLowerCase() || 'xxx'}.png`}" alt="" class="q-team-flag" onerror="this.style.display='none'">
        </div>
      </div>
      ${isLocked && predicted ? `
        <div class="q-pred-summary">
          Tu predicción: ${predicted === 'home' ? 'Gana ' + translateTeam(match.home_team) : predicted === 'away' ? 'Gana ' + translateTeam(match.away_team) : 'Empate'}
          ${prediction.predicted_home_score != null ? ` (${prediction.predicted_home_score}-${prediction.predicted_away_score})` : ''}
        </div>
      ` : ''}
    </div>
  `;
}
