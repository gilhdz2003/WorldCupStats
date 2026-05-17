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
        <div class="nav-links">
          <a href="#/" class="nav-link" data-route="/">Inicio</a>
          <a href="#/groups" class="nav-link" data-route="/groups">Grupos</a>
          <a href="#/schedule" class="nav-link" data-route="/schedule">Calendario</a>
        </div>
      </div>
    </nav>
  `;
}
