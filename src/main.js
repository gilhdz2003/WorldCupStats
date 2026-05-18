import './styles/index.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/animations.css';
import './styles/pages.css';

import { Router } from './router.js';

document.addEventListener('DOMContentLoaded', () => {
  const appElement = document.getElementById('app');
  const router = new Router(appElement);
  router.init();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
});
