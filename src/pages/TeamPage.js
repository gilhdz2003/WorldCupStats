import teamsData from '../data/teams.json';
import groupsData from '../data/groups.json';
import matchesData from '../data/matches.json';
import playersData from '../data/players.json';
import { renderTeamHeader } from '../components/TeamHeader.js';
import { renderPlayerCard } from '../components/PlayerCard.js';
import { renderFormation } from '../components/FormationView.js';
import { renderForumWidget, initForum } from '../components/ForumWidget.js';

export function TeamPage(teamAbbr) {
  const team = teamsData.find(t => t.abbreviation === teamAbbr);
  if (!team) return '<div class="container"><h1>Equipo no encontrado</h1></div>';

  const group = groupsData.find(g => g.teams.some(t => t.abbreviation === teamAbbr));
  const teamMatches = matchesData.filter(
    m => m.homeTeam?.abbreviation === teamAbbr || m.awayTeam?.abbreviation === teamAbbr
  );

  const roster = playersData[teamAbbr];
  const hasRoster = roster && roster.players;

  const playersByPosition = hasRoster
    ? ['GK', 'DF', 'MF', 'FW'].reduce((acc, posKey) => {
        acc[posKey] = roster.players.filter(p => p.position === posKey);
        return acc;
      }, {})
    : {};

  const positionLabels = {
    GK: 'PORTEROS',
    DF: 'DEFENSAS',
    MF: 'MEDIOCAMPISTAS',
    FW: 'DELANTEROS',
  };

  const sections = hasRoster
    ? Object.entries(playersByPosition).map(([pos, players]) => {
        if (players.length === 0) return '';
        return `
          <div class="team-section">
            <h3 class="team-section-title">${positionLabels[pos]}</h3>
            <div class="players-grid">
              ${players.map(p => renderPlayerCard(p)).join('')}
            </div>
          </div>
        `;
      }).join('')
    : '<p class="team-no-roster">Plantilla no disponible aun. Los rosters se confirmaran antes del inicio del torneo.</p>';

  const formationHTML = hasRoster
    ? renderFormation(
        roster.formation || '4-3-3',
        team.name,
        roster.players.slice(0, 11)
      )
    : '';

  const matchesHTML = teamMatches.length > 0
    ? teamMatches.map(m => {
        const isHome = m.homeTeam?.abbreviation === teamAbbr;
        const opponent = isHome ? m.awayTeam : m.homeTeam;
        const homeScore = m.homeTeam?.score ?? '-';
        const awayScore = m.awayTeam?.score ?? '-';
        const score = isHome ? `${homeScore} - ${awayScore}` : `${awayScore} - ${homeScore}`;
        return `
          <a href="#/match/${m.id}" class="team-match-row">
            <div class="team-match-opponent">
              <img src="${opponent?.logo || ''}" alt="" class="team-flag-sm" onerror="this.style.display='none'">
              <span>${isHome ? 'vs' : '@'} ${opponent?.name || 'TBD'}</span>
            </div>
            <div class="team-match-info">
              <span>${formatMatchDate(m.date)}</span>
              <span class="team-match-score">${score}</span>
            </div>
          </a>
        `;
      }).join('')
    : '<p class="team-no-roster">Partidos no disponibles.</p>';

  return `
    <section class="container" style="padding: var(--spacing-2xl) 0;">
      ${renderTeamHeader(team, group)}

      ${hasRoster ? `
      <div class="team-coach-bar">
        <span>DT: <strong>${roster.coach || 'Por confirmar'}</strong></span>
        ${roster.formation ? `<span>Formacion habitual: <strong>${roster.formation}</strong></span>` : ''}
      </div>
      ` : ''}

      <div class="team-section">
        <h3 class="team-section-title">JUGADORES CONVOCADOS</h3>
        ${sections}
      </div>

      ${formationHTML ? `
      <div class="team-section">
        <h3 class="team-section-title">ALINEACION PROBABLE</h3>
        ${formationHTML}
      </div>
      ` : ''}

      <div class="team-section">
        <h3 class="team-section-title">PARTIDOS</h3>
        <div class="team-matches-list">${matchesHTML}</div>
      </div>

      <div class="team-section">
        ${renderForumWidget(`team-${teamAbbr}`)}
      </div>
    </section>
  `;
}

export function initTeamPage() {
  initForum();
}

function formatMatchDate(dateStr) {
  if (!dateStr) return 'Fecha por confirmar';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).toUpperCase();
}
