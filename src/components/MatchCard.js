export function renderMatchCard(match) {
  const isLive = match.status === 'STATUS_IN_PROGRESS' || match.status === 'STATUS_HALFTIME';
  const isFinished = match.status === 'STATUS_FULL_TIME' || match.status === 'STATUS_POSTPONED';
  const isHalfTime = match.status === 'STATUS_HALFTIME';
  const hasScore = isLive || isFinished;

  const timeDisplay = hasScore
    ? `${match.homeTeam.score} - ${match.awayTeam.score}`
    : formatMatchTime(match.time);

  const liveClass = isLive ? ' match-card--live' : '';
  const finishedClass = isFinished ? ' match-card--finished' : '';

  const statusBadge = isLive
    ? `<span class="live-badge">${isHalfTime ? 'MEDIO TIEMPO' : 'EN VIVO'}</span>`
    : isFinished
      ? '<span class="ft-badge">FT</span>'
      : '';

  const broadcastHtml = (!hasScore && match.broadcasts?.length)
    ? `<span class="broadcast-badge">${match.broadcasts[0]}</span>`
    : '';

  return `
    <a href="#/match/${match.id}" class="match-card${liveClass}${finishedClass}">
      <div class="match-teams">
        <div class="match-team home">
          <img src="${match.homeTeam.logo}" alt="${match.homeTeam.name}" class="team-flag" onerror="this.style.display='none'">
          <span class="match-team-name">${match.homeTeam.name}</span>
          ${hasScore ? `<span class="match-score">${match.homeTeam.score}</span>` : ''}
        </div>
        <div class="match-center">
          ${!hasScore ? `<span class="match-time">${timeDisplay}</span>` : ''}
          ${statusBadge}
          ${broadcastHtml}
        </div>
        <div class="match-team away">
          <img src="${match.awayTeam.logo}" alt="${match.awayTeam.name}" class="team-flag" onerror="this.style.display='none'">
          <span class="match-team-name">${match.awayTeam.name}</span>
          ${hasScore ? `<span class="match-score">${match.awayTeam.score}</span>` : ''}
        </div>
      </div>
      <div class="match-meta">
        ${match.venue?.name ? `<span class="match-venue">${match.venue.name}, ${match.venue.city}</span>` : ''}
      </div>
    </a>
  `;
}

function formatMatchTime(isoString) {
  if (!isoString) return '--:--';
  const d = new Date(isoString);
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
}
