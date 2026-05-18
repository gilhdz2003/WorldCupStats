import teamsData from '../data/teams.json';
import groupsData from '../data/groups.json';

function getGroupForTeam(teamAbbr) {
  const group = groupsData.find(g => g.teams.some(t => t.abbreviation === teamAbbr));
  return group ? group.name.replace('GRUPO ', '') : '?';
}

export function Teams() {
  const teamCards = teamsData.map(team => `
    <a href="#/team/${team.abbreviation}" class="team-grid-card">
      <div class="team-grid-logo-wrap">
        <img src="${team.logoLocal}" alt="${team.name}" class="team-grid-logo" onerror="this.src='https://a.espncdn.com/i/teamlogos/countries/500/${team.slug}.png'">
      </div>
      <div class="team-grid-name">${team.name}</div>
      <div class="team-grid-meta">Grupo ${getGroupForTeam(team.abbreviation)}</div>
    </a>
  `).join('');

  return `
    <section class="container" style="padding: var(--spacing-2xl) 0;">
      <h1 style="font-size: 2.5rem; letter-spacing: 1px; margin-bottom: var(--spacing-lg); text-align: center;">
        SELECCIONES
      </h1>
      <p style="text-align: center; color: var(--text-secondary); margin-bottom: var(--spacing-2xl); font-size: 1.1rem;">
        48 selecciones participantes del Mundial FIFA 2026™
      </p>
      <div class="teams-grid">
        ${teamCards}
      </div>
    </section>
  `;
}
