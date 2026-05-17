import { renderMatchDetail } from '../components/MatchDetail.js';
import { renderMatchCard } from '../components/MatchCard.js';
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
  const comments = getComments(match.id);
  return `
    <div class="comment-section" style="margin-top: var(--spacing-2xl);">
      <h3 style="font-size: 1.3rem; letter-spacing: 1px; margin-bottom: var(--spacing-lg);">COMENTARIOS</h3>
      <div class="comment-form">
        <div class="comment-input-row">
          <input type="text" id="comment-author" placeholder="Tu nombre" class="comment-input comment-input-name" maxlength="30">
          <input type="text" id="comment-text" placeholder="Escribe un comentario..." class="comment-input comment-input-text" maxlength="280">
          <button class="comment-submit" data-match="${escapeAttr(match.id)}">Enviar</button>
        </div>
      </div>
      <div class="comment-list" id="comment-list-${escapeAttr(match.id)}">
        ${comments.length > 0
          ? comments.map(c => renderComment(c)).join('')
          : '<p class="text-muted" style="padding: var(--spacing-lg) 0;">Sé el primero en comentar.</p>'
        }
      </div>
    </div>
  `;
}

function renderComment(c) {
  const time = new Date(c.timestamp).toLocaleString('es-MX', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });
  return `
    <div class="comment-item">
      <div class="comment-header">
        <span class="comment-author">${escapeHTML(c.author)}</span>
        <span class="comment-time">${time}</span>
      </div>
      <div class="comment-body">${escapeHTML(c.text)}</div>
    </div>
  `;
}

function getComments(matchId) {
  try {
    const stored = localStorage.getItem('mundial-comments-' + matchId);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Comment submission via event delegation
if (!window._commentListener) {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.comment-submit');
    if (!btn) return;
    const matchId = btn.dataset.match;
    const authorEl = document.getElementById('comment-author');
    const textEl = document.getElementById('comment-text');
    if (!authorEl || !textEl) return;

    const author = authorEl.value.trim() || 'Anónimo';
    const text = textEl.value.trim();
    if (!text) return;

    const comment = { author, text, timestamp: Date.now() };
    const comments = getComments(matchId);
    comments.push(comment);
    localStorage.setItem('mundial-comments-' + matchId, JSON.stringify(comments));

    if (author !== 'Anónimo') {
      localStorage.setItem('mundial-username', author);
    }

    // Append new comment to list
    const listEl = document.getElementById('comment-list-' + matchId);
    if (listEl) {
      const placeholder = listEl.querySelector('.text-muted');
      if (placeholder) placeholder.remove();
      listEl.insertAdjacentHTML('beforeend', renderComment(comment));
    }

    textEl.value = '';
  });

  window._commentListener = true;
}
