export function renderGroupCard(group) {
  const teamRows = group.teams.map(team => `
    <div class="team-row">
      <img src="${team.logo}" alt="${team.name}" class="team-flag" onerror="this.style.display='none'">
      <span class="team-name">${team.name}</span>
    </div>
  `).join('');

  return `
    <div class="group-card">
      <div class="group-header bg-group-${group.id}">
        ${group.name}
      </div>
      <div class="group-teams">
        ${teamRows}
      </div>
    </div>
  `;
}
