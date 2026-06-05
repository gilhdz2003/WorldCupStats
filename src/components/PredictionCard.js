export function renderPredictionCard(match, prediction, isModified) {
  const isLocked = match.is_locked || match.status === 'finished';
  const isFinished = match.status === 'finished';
  const predicted = prediction?.predicted_result;
  const lockedClass = isLocked ? ' q-prediction-card--locked' : '';
  const hasResult = isFinished && match.home_score !== null;

  // Determine if user got points
  let resultBadge = '';
  if (hasResult && predicted) {
    const actualResult = match.home_score > match.away_score ? 'home' : match.home_score < match.away_score ? 'away' : 'draw';
    const isExact = prediction.predicted_home_score === match.home_score && prediction.predicted_away_score === match.away_score;
    const isCorrect = predicted === actualResult;
    if (isExact) resultBadge = '<span class="q-badge q-badge--exact">+5</span>';
    else if (isCorrect) resultBadge = '<span class="q-badge q-badge--correct">+3</span>';
    else resultBadge = '<span class="q-badge q-badge--miss">0</span>';
  }

  return `
    <div class="q-prediction-card${lockedClass}" data-match-id="${match.id}">
      <div class="q-pred-teams">
        <div class="q-pred-team q-pred-team--home">
          <img src="${match.home_logo || `/logos/${match.home_abbr?.toLowerCase() || 'xxx'}.png`}" alt="" class="q-team-flag" onerror="this.style.display='none'">
          <span class="q-pred-team-name">${match.home_team}</span>
          ${hasResult ? `<span class="q-pred-score">${match.home_score}</span>` : ''}
        </div>
        <div class="q-pred-center">
          ${!isLocked ? `
            <button class="q-option ${predicted === 'home' ? 'q-option--selected' : ''}" data-result="home" title="Gana Local">🏠</button>
          ` : ''}
          ${!isLocked ? `
            <button class="q-option q-option--draw ${predicted === 'draw' ? 'q-option--selected' : ''}" data-result="draw" title="Empate">🤝</button>
          ` : ''}
          ${!isLocked ? `
            <button class="q-option ${predicted === 'away' ? 'q-option--selected' : ''}" data-result="away" title="Gana Visita">✈️</button>
          ` : ''}
          ${isLocked ? (hasResult ? `${match.home_score} - ${match.away_score}` : '🔒') : ''}
          ${resultBadge}
        </div>
        <div class="q-pred-team q-pred-team--away">
          <img src="${match.away_logo || `/logos/${match.away_abbr?.toLowerCase() || 'xxx'}.png`}" alt="" class="q-team-flag" onerror="this.style.display='none'">
          <span class="q-pred-team-name">${match.away_team}</span>
          ${hasResult ? `<span class="q-pred-score">${match.away_score}</span>` : ''}
        </div>
      </div>
      ${!isLocked ? `
        <div class="q-pred-scores">
          <div class="q-score-row">
            <label>Marcador:</label>
            <input type="number" class="q-score-input q-score-home" min="0" max="99" placeholder="-" value="${prediction?.predicted_home_score || ''}">
            <span>-</span>
            <input type="number" class="q-score-input q-score-away" min="0" max="99" placeholder="-" value="${prediction?.predicted_away_score || ''}">
            <span class="q-score-hint">(opcional, +2 pts extra)</span>
          </div>
        </div>
      ` : ''}
      ${isLocked && predicted ? `
        <div class="q-pred-summary">
          Tu predicción: ${predicted === 'home' ? 'Gana ' + match.home_team : predicted === 'away' ? 'Gana ' + match.away_team : 'Empate'}
          ${prediction.predicted_home_score != null ? ` (${prediction.predicted_home_score}-${prediction.predicted_away_score})` : ''}
        </div>
      ` : ''}
    </div>
  `;
}
