export function renderMatchCard(match) {
  const isLive = match.status === 'STATUS_IN_PROGRESS' || match.status === 'STATUS_HALFTIME';
  const isFinished = match.status === 'STATUS_FULL_TIME' || match.status === 'STATUS_POSTPONED';
  const timeDisplay = isLive
    ? `${match.homeTeam.score} - ${match.awayTeam.score}`
    : isFinished
      ? `${match.homeTeam.score} - ${match.awayTeam.score}`
      : formatMatchTime(match.time);

  const statusBadge = isLive
    ? '<span class="live-badge">EN VIVO</span>'
    : isFinished
      ? '<span class="ft-badge">FT</span>'
      : '';

  return `
    <a href="#/match/${match.id}" class="match-card">
      <div class="match-teams">
        <div class="match-team home">
          <img src="${match.homeTeam.logo}" alt="${match.homeTeam.name}" class="team-flag" onerror="this.style.display='none'">
          <span class="match-team-name">${match.homeTeam.name}</span>
        </div>
        <div class="match-time">
          ${timeDisplay}
        </div>
        <div class="match-team away">
          <img src="${match.awayTeam.logo}" alt="${match.awayTeam.name}" class="team-flag" onerror="this.style.display='none'">
          <span class="match-team-name">${match.awayTeam.name}</span>
        </div>
      </div>
      <div class="match-meta">
        ${statusBadge}
        ${match.venue?.name ? `${match.venue.name}, ${match.venue.city}` : ''}
      </div>
    </a>
  `;
}

function formatMatchTime(isoString) {
  if (!isoString) return '--:--';
  const d = new Date(isoString);
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
}
