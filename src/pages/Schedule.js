import { renderDateNav } from '../components/DateNav.js';
import { renderMatchCard } from '../components/MatchCard.js';
import matchesData from '../data/matches.json';
import groupsData from '../data/groups.json';

function getFirstMatchDate() {
  const dates = [...new Set(matchesData.map(m => m.date))].sort();
  return dates[0] || '2026-06-11';
}

export function Schedule() {
  const initialDate = getFirstMatchDate();
  const groupOptions = groupsData.map(g =>
    `<option value="${g.id}">Grupo ${g.id}</option>`
  ).join('');

  return `
    <section class="container" style="padding: var(--spacing-2xl) 0;">
      <h1 style="font-size: 2.5rem; letter-spacing: 1px; margin-bottom: var(--spacing-md); text-align: center;">
        CALENDARIO DEL MUNDIAL
      </h1>

      <div class="schedule-filters flex justify-between items-center" style="margin-bottom: var(--spacing-lg);">
        <div class="filter-group">
          <label for="group-filter" class="text-secondary" style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px;">Filtrar por grupo</label>
          <select id="group-filter" class="group-select">
            <option value="all">Todos los grupos</option>
            ${groupOptions}
          </select>
        </div>
        <div class="text-secondary" style="font-size: 0.85rem;">
          <span id="match-count">${matchesData.length}</span> partidos
        </div>
      </div>

      <div class="date-nav" id="date-nav-container" style="margin-bottom: var(--spacing-xl);">
        ${renderDateNav(initialDate)}
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-lg" id="matches-list">
        ${getMatchesHTML(initialDate, 'all')}
      </div>
    </section>
  `;
}

function getMatchesHTML(date, group) {
  let matches = matchesData.filter(m => m.date === date);
  if (group !== 'all') {
    matches = matches.filter(m => m.group === group);
  }
  if (matches.length === 0) {
    return '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: var(--spacing-3xl) 0;">No hay partidos para esta fecha y grupo.</div>';
  }
  return matches.map(match => renderMatchCard(match)).join('');
}

// Current filter state
let currentGroup = 'all';

// Event delegation — attached once
if (!window._scheduleListener) {
  document.addEventListener('click', (e) => {
    const tab = e.target.closest('.date-tab');
    if (tab) {
      const date = tab.dataset.date;
      if (!date) return;
      const listEl = document.getElementById('matches-list');
      const navEl = document.getElementById('date-nav-container');
      if (listEl) listEl.innerHTML = getMatchesHTML(date, currentGroup);
      if (navEl) {
        navEl.innerHTML = renderDateNav(date);
        requestAnimationFrame(() => {
          const activeTab = navEl.querySelector('.date-tab.active');
          activeTab?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        });
      }
    }
  });

  document.addEventListener('change', (e) => {
    if (e.target.id === 'group-filter') {
      currentGroup = e.target.value;
      const activeTab = document.querySelector('.date-tab.active');
      const date = activeTab?.dataset.date || getFirstMatchDate();
      const listEl = document.getElementById('matches-list');
      if (listEl) listEl.innerHTML = getMatchesHTML(date, currentGroup);

      const countEl = document.getElementById('match-count');
      if (countEl) {
        const total = currentGroup === 'all'
          ? matchesData.filter(m => m.date === date).length
          : matchesData.filter(m => m.date === date && m.group === currentGroup).length;
        countEl.textContent = total;
      }
    }
  });

  window._scheduleListener = true;
}

export function initSchedule() {
  const navEl = document.getElementById('date-nav-container');
  if (!navEl) return;
  const activeTab = navEl.querySelector('.date-tab.active');
  if (activeTab) {
    requestAnimationFrame(() => {
      activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
  }
}
