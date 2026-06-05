import './styles/index.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/animations.css';
import './styles/pages.css';
import './styles/quiniela.css';

import { Router } from './router.js';

// Theme: default light, saved preference, or dark
const savedTheme = localStorage.getItem('mundial2026-theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

document.addEventListener('DOMContentLoaded', () => {
  const appElement = document.getElementById('app');
  const router = new Router(appElement);

  // Theme toggle — rebind after every route change since Router rebuilds innerHTML
  const updateIcon = (btn) => {
    btn.textContent = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
  };
  const bindThemeToggle = () => {
    const themeBtn = document.getElementById('q-theme-toggle');
    if (themeBtn) {
      updateIcon(themeBtn);
      themeBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('mundial2026-theme', next);
        updateIcon(themeBtn);
      });
    }
  };

  // Hook into Router: bind after every render
  const origHandleRoute = router.handleRoute.bind(router);
  router.handleRoute = function () {
    origHandleRoute();
    bindThemeToggle();
  };

  router.init();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
});
