import { renderMatchDetail } from '../components/MatchDetail.js';
import { renderMatchCard } from '../components/MatchCard.js';
import { renderForumWidget, initForum } from '../components/ForumWidget.js';
import matchesData from '../data/matches.json';

export function MatchPage(matchId) {
  const match = matchesData.find(m => m.id === matchId);

  if (!match) {
    return `
      <section class="container" style="padding: var(--spacing-3xl) 0; text-align: center;">
        <h2>Partido no encontrado</h2>
        <a href="#/schedule" style="color: var(--accent-secondary); margin-top: var(--spacing-md); display: inline-block;">Volver al Calendario</a>
      </section>
    `;
  }

  const relatedMatches = matchesData.filter(m =>
    m.group === match.group && m.id !== match.id
  );

  return `
    <section class="container" style="padding: var(--spacing-2xl) 0;">
      <a href="#/schedule" style="color: var(--text-secondary); display: inline-block; margin-bottom: var(--spacing-lg);">&larr; Volver al Calendario</a>

      ${renderMatchDetail(match)}

      <div class="match-extras grid md:grid-cols-2 gap-lg" style="margin-top: var(--spacing-2xl);">
        <div class="match-info-panel">
          <h3 style="font-size: 1.3rem; letter-spacing: 1px; margin-bottom: var(--spacing-lg);">INFORMACIÓN DEL PARTIDO</h3>
          ${renderMatchInfo(match)}
        </div>
        <div class="match-info-panel">
          <h3 style="font-size: 1.3rem; letter-spacing: 1px; margin-bottom: var(--spacing-lg);">TRANSMISIÓN</h3>
          ${renderBroadcastInfo(match)}
        </div>
      </div>

      ${renderCommentSection(match)}

      ${relatedMatches.length > 0 ? `
        <div style="margin-top: var(--spacing-3xl);">
          <h2 style="font-size: 1.5rem; letter-spacing: 1px; margin-bottom: var(--spacing-lg);">MÁS PARTIDOS DEL GRUPO ${match.group}</h2>
          <div class="grid md:grid-cols-${Math.min(relatedMatches.length, 3)} gap-lg">
            ${relatedMatches.map(m => renderMatchCard(m)).join('')}
          </div>
        </div>
      ` : ''}
    </section>
  `;
}

function renderMatchInfo(match) {
  const matchDate = new Date(match.time);
  const dateStr = matchDate.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const timeStr = matchDate.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const items = [
    { label: 'Fecha', value: dateStr.charAt(0).toUpperCase() + dateStr.slice(1) },
    { label: 'Hora', value: timeStr + ' (hora local)' },
    { label: 'Estadio', value: match.venue?.name || 'Por confirmar' },
    { label: 'Ciudad', value: match.venue?.city || 'Por confirmar' },
    { label: 'Grupo', value: match.group },
  ];

  return `
    <div class="info-list">
      ${items.map(item => `
        <div class="info-row">
          <span class="info-label">${item.label}</span>
          <span class="info-value">${item.value}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderBroadcastInfo(match) {
  const broadcasts = match.broadcasts || [];
  if (broadcasts.length === 0) {
    return '<p class="text-muted">Información de transmisión por confirmar.</p>';
  }
  const colors = {
    'FOX': '#003DA5', 'FS1': '#0077C8', 'Tele': '#E31837',
    'Peacock': '#333333', 'Telemundo': '#E31837', 'Universo': '#1A1A1A',
    'fuboTV': '#6E44FF',
  };
  return `
    <div class="broadcast-chips">
      ${broadcasts.map(b => {
        const c = colors[b] || '#444';
        return '<span class="broadcast-chip" style="--chip-color: ' + c + '">' + escapeAttr(b) + '</span>';
      }).join('')}
    </div>
  `;
}

function renderCommentSection(match) {
  return `
    <div class="comment-section" style="margin-top: var(--spacing-2xl);">
      ${renderForumWidget(`match-${match.id}`)}
    </div>
  `;
}

function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function initMatchPage() {
  initForum();
}
