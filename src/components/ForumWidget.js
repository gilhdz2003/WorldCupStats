const API_URL = '/api/comments.php';
const USERNAME_KEY = 'mundial2026_username';

function commentsUrl(threadId) {
  return `${API_URL}?thread=${encodeURIComponent(threadId)}&t=${Date.now()}`;
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

function createCommentEl(author, message, timeText) {
  const el = document.createElement('div');
  el.className = 'forum-message';

  const header = document.createElement('div');
  header.className = 'forum-message-header';

  const authorSpan = document.createElement('span');
  authorSpan.className = 'forum-author';
  authorSpan.textContent = `@${author}`;

  const timeSpan = document.createElement('span');
  timeSpan.className = 'forum-time';
  timeSpan.textContent = timeText;

  header.appendChild(authorSpan);
  header.appendChild(timeSpan);

  const body = document.createElement('div');
  body.className = 'forum-body';
  body.textContent = message;

  el.appendChild(header);
  el.appendChild(body);
  return el;
}

export function renderForumWidget(threadId) {
  const savedName = localStorage.getItem(USERNAME_KEY) || '';
  const escapedName = savedName.replace(/"/g, '&quot;').replace(/</g, '&lt;');

  return `
    <div class="forum-widget" data-thread="${threadId}">
      <h3 style="font-size: 1.2rem; margin-bottom: var(--spacing-md); letter-spacing: 0.5px;">
        COMENTARIOS
        <span class="forum-count">...</span>
      </h3>
      <div class="forum-messages" id="forum-messages-${threadId}">
        <p class="forum-empty">Cargando comentarios...</p>
      </div>
      <div class="forum-input-area">
        <input type="text" class="forum-input forum-input-name" placeholder="Tu nombre" value="${escapedName}" maxlength="20">
        <input type="text" class="forum-input forum-input-text" placeholder="Escribe un comentario..." maxlength="500">
        <button class="forum-submit" data-thread="${threadId}">Enviar</button>
      </div>
    </div>
  `;
}

function populateComments(container, comments, countEl) {
  container.innerHTML = '';
  if (comments.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'forum-empty';
    empty.textContent = 'Se el primero en comentar';
    container.appendChild(empty);
  } else {
    comments.forEach(c => {
      container.appendChild(createCommentEl(c.author, c.message, formatTimeAgo(c.timestamp)));
    });
  }
  if (countEl) countEl.textContent = comments.length;
}

export function initForum() {
  document.querySelectorAll('.forum-widget').forEach(widget => {
    const threadId = widget.dataset.thread;
    const messagesEl = widget.querySelector('.forum-messages');
    const countEl = widget.querySelector('.forum-count');

    const loadComments = () => fetch(commentsUrl(threadId), { cache: 'no-store' })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(comments => {
        populateComments(messagesEl, comments, countEl);
      })
      .catch(() => {
        messagesEl.innerHTML = '';
        const err = document.createElement('p');
        err.className = 'forum-empty';
        err.textContent = 'No se pudieron cargar los comentarios';
        messagesEl.appendChild(err);
        if (countEl) countEl.textContent = '0';
      });

    // Fetch existing comments
    loadComments();

    // Submit handler
    const btn = widget.querySelector('.forum-submit');
    btn.addEventListener('click', () => {
      const nameInput = widget.querySelector('.forum-input-name');
      const textInput = widget.querySelector('.forum-input-text');
      const name = nameInput.value.trim();
      const text = textInput.value.trim();

      if (!name || !text) return;

      localStorage.setItem(USERNAME_KEY, name);
      btn.disabled = true;
      btn.textContent = '...';

      fetch(API_URL, {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread_id: threadId, author: name, message: text }),
      })
        .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e.error || r.status)))
        .then(() => {
          textInput.value = '';
          return loadComments();
        })
        .catch(err => {
          alert('Error al enviar: ' + err);
        })
        .finally(() => {
          btn.disabled = false;
          btn.textContent = 'Enviar';
        });
    });
  });
}
