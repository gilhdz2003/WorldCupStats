import groupsData from '../data/groups.json';

export function Groups() {
  const groupCards = groupsData.map(group => renderGroupStandings(group)).join('');

  return `
    <section class="container" style="padding: var(--spacing-2xl) 0;">
      <h1 style="font-size: 2.5rem; letter-spacing: 1px; margin-bottom: var(--spacing-xl); text-align: center;">
        GRUPOS DEL MUNDIAL
      </h1>
      <div class="groups-grid">
        ${groupCards}
      </div>
    </section>
  `;
}

function renderGroupStandings(group) {
  const rows = group.teams.map((team, i) => {
    const s = team.stats;
    const rankClass = i < 2 ? 'qualify' : '';
    return `
      <tr class="standings-row ${rankClass}">
        <td class="standings-rank">${i + 1}</td>
        <td class="standings-team">
          <img src="${team.logo}" alt="${team.name}" class="team-flag-sm" onerror="this.style.display='none'">
          <a href="#/team/${team.abbreviation}" class="team-link">${team.name}</a>
        </td>
        <td>${s.gamesPlayed}</td>
        <td>${s.wins}</td>
        <td>${s.ties}</td>
        <td>${s.losses}</td>
        <td>${s.goalsFor}</td>
        <td>${s.goalsAgainst}</td>
        <td class="standings-pts">${s.points}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="group-card">
      <div class="group-header bg-group-${group.id}">
        ${group.name}
      </div>
      <div class="standings-table-wrap">
        <table class="standings-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Equipo</th>
              <th>PJ</th>
              <th>V</th>
              <th>E</th>
              <th>P</th>
              <th>GF</th>
              <th>GC</th>
              <th>Pts</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
