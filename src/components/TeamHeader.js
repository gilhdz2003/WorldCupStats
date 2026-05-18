export function renderTeamHeader(team, group) {
  const groupName = group ? group.name : '';
  const color = `#${team.color || '333333'}`;

  return `
    <div class="team-header" style="--team-color: ${color};">
      <div class="team-header-bg" style="background: linear-gradient(135deg, ${color}33 0%, transparent 60%);"></div>
      <div class="team-header-content">
        <img src="${team.logoLocal}" alt="${team.name}" class="team-header-logo" onerror="this.src='https://a.espncdn.com/i/teamlogos/countries/500/${team.slug}.png'">
        <div class="team-header-info">
          <h1 class="team-header-name">${team.name.toUpperCase()}</h1>
          <div class="team-header-meta">
            ${groupName ? `<span class="team-header-tag">${groupName}</span>` : ''}
            <span class="team-header-tag">${team.abbreviation}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}
