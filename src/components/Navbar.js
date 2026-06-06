export function renderNavbar() {
  return `
    <nav class="navbar">
      <div class="container flex justify-between items-center">
        <a href="#/" class="nav-brand flex items-center gap-sm">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
            <path d="M2 12h20"></path>
          </svg>
          MUNDIAL 2026
        </a>
        <button class="nav-hamburger" id="nav-hamburger-btn" aria-label="Abrir menú">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" stroke-width="2" stroke-linecap="round">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div class="nav-links" id="nav-links">
          <a href="#/" class="nav-link" data-route="/">Inicio</a>
          <a href="#/groups" class="nav-link" data-route="/groups">Grupos</a>
          <a href="#/teams" class="nav-link" data-route="/teams">Selecciones</a>
          <a href="#/schedule" class="nav-link" data-route="/schedule">Calendario</a>
          <a href="#/quiniela" class="nav-link" data-route="/quiniela" style="color: var(--accent-primary);">🏆 Quiniela</a>
          <button class="theme-toggle" id="q-theme-toggle" title="Cambiar tema">🌙</button>
        </div>
      </div>
      <div class="nav-mobile-overlay" id="nav-mobile-overlay"></div>
    </nav>
  `;
}

export function initNavbar() {
  const hamburgerBtn = document.getElementById('nav-hamburger-btn');
  const navLinks = document.getElementById('nav-links');
  const overlay = document.getElementById('nav-mobile-overlay');

  if (!hamburgerBtn || !navLinks) return;

  function toggleMenu() {
    const isOpen = navLinks.classList.toggle('nav-mobile-open');
    if (overlay) overlay.classList.toggle('nav-overlay-visible', isOpen);
    hamburgerBtn.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  function closeMenu() {
    navLinks.classList.remove('nav-mobile-open');
    if (overlay) overlay.classList.remove('nav-overlay-visible');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburgerBtn.addEventListener('click', toggleMenu);

  if (overlay) {
    overlay.addEventListener('click', closeMenu);
  }

  // Close menu when a link is clicked
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close menu on hash change (in case of direct link)
  window.addEventListener('hashchange', closeMenu);
}
