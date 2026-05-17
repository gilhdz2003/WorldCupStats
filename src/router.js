import { renderNavbar } from './components/Navbar.js';
import { renderFooter } from './components/Footer.js';

// Import pages
import { Home } from './pages/Home.js';
import { Groups } from './pages/Groups.js';
import { Schedule } from './pages/Schedule.js';
import { MatchPage } from './pages/MatchPage.js';

const routes = {
  '/': () => Home(),
  '/groups': () => Groups(),
  '/schedule': () => Schedule(),
};

export class Router {
  constructor(appElement) {
    this.appElement = appElement;
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  init() {
    this.handleRoute();
  }

  handleRoute() {
    const path = window.location.hash.slice(1) || '/';
    let renderPage;

    // Rutas dinámicas
    if (path.startsWith('/match/')) {
      const matchId = path.split('/')[2];
      renderPage = () => MatchPage(matchId);
    } else {
      renderPage = routes[path] || routes['/'];
    }
    
    this.appElement.innerHTML = `
      ${renderNavbar()}
      <main class="animate-fade-in">
        ${renderPage()}
      </main>
      ${renderFooter()}
    `;
    
    this.updateActiveLink(path);
    window.scrollTo(0, 0);
  }

  updateActiveLink(path) {
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
      link.classList.remove('active');
      if (link.dataset.route === path) {
        link.classList.add('active');
      }
    });
  }
}
