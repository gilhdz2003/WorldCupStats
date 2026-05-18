const STORAGE_KEY = 'mundial2026_comments';
const USERNAME_KEY = 'mundial2026_username';

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function getComments(threadId) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return all[threadId] || [];
  } catch {
    return [];
  }
}

function saveComment(threadId, author, message) {
  const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  if (!all[threadId]) all[threadId] = [];
  all[threadId].push({
    id: Date.now(),
    author,
    message,
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function formatTimeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

export function renderForumWidget(threadId) {
  const comments = getComments(threadId);
  const savedName = localStorage.getItem(USERNAME_KEY) || '';

  const commentsHTML = comments.map(c => `
    <div class="forum-message">
      <div class="forum-message-header">
        <span class="forum-author">@${escapeHTML(c.author)}</span>
        <span class="forum-time">${formatTimeAgo(c.timestamp)}</span>
      </div>
      <div class="forum-body">${escapeHTML(c.message)}</div>
    </div>
  `).join('');

  return `
    <div class="forum-widget" data-thread="${threadId}">
      <h3 style="font-size: 1.2rem; margin-bottom: var(--spacing-md); letter-spacing: 0.5px;">
        COMENTARIOS
        <span class="forum-count">${comments.length}</span>
      </h3>
      <div class="forum-messages" id="forum-messages-${threadId}">
        ${comments.length > 0 ? commentsHTML : '<p class="forum-empty">Se el primero en comentar</p>'}
      </div>
      <div class="forum-input-area">
        <input type="text" class="forum-input forum-input-name" placeholder="Tu nombre" value="${escapeHTML(savedName)}" maxlength="20">
        <input type="text" class="forum-input forum-input-text" placeholder="Escribe un comentario..." maxlength="280">
        <button class="forum-submit" data-thread="${threadId}">Enviar</button>
      </div>
    </div>
  `;
}

export function initForum() {
  document.querySelectorAll('.forum-submit').forEach(btn => {
    btn.addEventListener('click', () => {
      const threadId = btn.dataset.thread;
      const widget = btn.closest('.forum-widget');
      const nameInput = widget.querySelector('.forum-input-name');
      const textInput = widget.querySelector('.forum-input-text');
      const name = nameInput.value.trim();
      const text = textInput.value.trim();

      if (!name || !text) return;

      localStorage.setItem(USERNAME_KEY, name);
      saveComment(threadId, name, text);
      textInput.value = '';

      const messagesContainer = widget.querySelector('.forum-messages');
      const emptyMsg = messagesContainer.querySelector('.forum-empty');
      if (emptyMsg) emptyMsg.remove();

      const countEl = widget.querySelector('.forum-count');
      const currentCount = parseInt(countEl?.textContent || '0');
      if (countEl) countEl.textContent = currentCount + 1;

      const msgEl = document.createElement('div');
      msgEl.className = 'forum-message animate-fade-in';
      const headerEl = document.createElement('div');
      headerEl.className = 'forum-message-header';
      const authorSpan = document.createElement('span');
      authorSpan.className = 'forum-author';
      authorSpan.textContent = `@${name}`;
      const timeSpan = document.createElement('span');
      timeSpan.className = 'forum-time';
      timeSpan.textContent = 'ahora';
      headerEl.appendChild(authorSpan);
      headerEl.appendChild(timeSpan);
      const bodyEl = document.createElement('div');
      bodyEl.className = 'forum-body';
      bodyEl.textContent = text;
      msgEl.appendChild(headerEl);
      msgEl.appendChild(bodyEl);
      messagesContainer.appendChild(msgEl);
    });
  });
}
