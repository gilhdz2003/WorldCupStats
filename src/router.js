import { renderNavbar, initNavbar } from './components/Navbar.js';
import { renderFooter } from './components/Footer.js';

import { Home, initHomeLive } from './pages/Home.js';
import { Groups } from './pages/Groups.js';
import { Schedule } from './pages/Schedule.js';
import { MatchPage, initMatchPage } from './pages/MatchPage.js';
import { Teams } from './pages/Teams.js';
import { TeamPage, initTeamPage } from './pages/TeamPage.js';
import { PlayerPage } from './pages/PlayerPage.js';
import { startPolling, stopPolling } from './espn-poll.js';
import { QuinielaHome, initQuinielaHome } from './pages/QuinielaHome.js';
import { QuinielaPredictions, initQuinielaPredictions } from './pages/QuinielaPredictions.js';
import { QuinielaLeaderboard, initQuinielaLeaderboard } from './pages/QuinielaLeaderboard.js';
import { QuinielaAdmin, initQuinielaAdmin } from './pages/QuinielaAdmin.js';

const routes = {
  '/': () => Home(),
  '/groups': () => Groups(),
  '/teams': () => Teams(),
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
    let afterRender = null;

    if (path.startsWith('/match/')) {
      const matchId = path.split('/')[2];
      renderPage = () => MatchPage(matchId);
      afterRender = () => initMatchPage();
    } else if (path.startsWith('/team/')) {
      const teamAbbr = path.split('/')[2];
      renderPage = () => TeamPage(teamAbbr);
      afterRender = () => initTeamPage();
    } else if (path.startsWith('/player/')) {
      const playerId = path.split('/')[2];
      renderPage = () => PlayerPage(playerId);
    } else if (path === '/quiniela') {
      renderPage = () => QuinielaHome();
      afterRender = () => initQuinielaHome();
    } else if (path === '/quiniela/predictions') {
      renderPage = () => QuinielaPredictions();
      afterRender = () => initQuinielaPredictions();
    } else if (path === '/quiniela/leaderboard') {
      renderPage = () => QuinielaLeaderboard();
      afterRender = () => initQuinielaLeaderboard();
    } else if (path === '/quiniela/admin') {
      renderPage = () => QuinielaAdmin();
      afterRender = () => initQuinielaAdmin();
    } else {
      renderPage = routes[path] || routes['/'];
    }

    this.appElement.innerHTML = [
      renderNavbar(),
      '<main class="animate-fade-in">',
      renderPage(),
      '</main>',
      renderFooter(),
    ].join('');

    this.updateActiveLink(path);
    initNavbar();
    window.scrollTo(0, 0);

    if (afterRender) setTimeout(afterRender, 0);

    // Live scoring: start on home/schedule, stop otherwise
    if (path === '/' || path === '/schedule') {
      startPolling();
    } else {
      stopPolling();
    }

    if (path === '/') {
      import('./components/Countdown.js').then(({ initCountdown }) => {
        setTimeout(initCountdown, 0);
      });
      setTimeout(initHomeLive, 0);
    }
  }

  updateActiveLink(path) {
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
      link.classList.remove('active');
      const route = link.dataset.route;
      if (route === path || (route !== '/' && path.startsWith(route))) {
        link.classList.add('active');
      }
    });
  }
}
