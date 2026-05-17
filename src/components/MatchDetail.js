export function renderMatchDetail(match) {
  const matchDate = new Date(match.time);
  const dateStr = matchDate.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).toUpperCase();

  return `
    <div class="match-detail" style="background-color: var(--bg-secondary); border-radius: var(--radius-xl); padding: var(--spacing-2xl); text-align: center; border: 1px solid var(--border-color); box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
      <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: var(--spacing-xl); text-transform: uppercase; letter-spacing: 1px;">
        Grupo ${match.group} • ${match.statusDetail || 'Por jugar'}
      </div>

      <div class="flex flex-col md-flex-row justify-between items-center gap-xl" style="margin-bottom: var(--spacing-2xl);">
        <div class="flex flex-col items-center gap-md" style="flex: 1;">
          <img src="${match.homeTeam.logo}" alt="${match.homeTeam.name}" style="width: 80px; height: 50px; object-fit: contain;" onerror="this.style.display='none'">
          <h2 style="font-size: clamp(1.5rem, 5vw, 2rem); text-align: center;">${match.homeTeam.name}</h2>
        </div>

        <div class="flex flex-col items-center" style="flex: 1; margin: var(--spacing-md) 0;">
          <div style="font-family: var(--font-mono); font-size: clamp(2.5rem, 8vw, 3.5rem); font-weight: 700; line-height: 1;">${match.homeTeam.score} - ${match.awayTeam.score}</div>
        </div>

        <div class="flex flex-col items-center gap-md" style="flex: 1;">
          <img src="${match.awayTeam.logo}" alt="${match.awayTeam.name}" style="width: 80px; height: 50px; object-fit: contain;" onerror="this.style.display='none'">
          <h2 style="font-size: clamp(1.5rem, 5vw, 2rem); text-align: center;">${match.awayTeam.name}</h2>
        </div>
      </div>

      <div style="margin-bottom: var(--spacing-2xl);">
        <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: var(--spacing-sm);">${dateStr}</div>
        <div style="font-family: var(--font-headline); font-size: 1.2rem; margin-bottom: var(--spacing-xs);">Mundial FIFA 2026™</div>
        ${match.venue?.name ? `<div style="color: var(--text-muted); font-size: 0.9rem;">${match.venue.city} • ${match.venue.name}</div>` : ''}
        ${match.broadcasts?.length ? `<div style="color: var(--text-muted); font-size: 0.8rem; margin-top: var(--spacing-xs);">TV: ${match.broadcasts.join(' • ')}</div>` : ''}
      </div>
    </div>
  `;
}
