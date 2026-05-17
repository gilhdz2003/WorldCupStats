export function renderCountdown() {
  return `
    <div class="countdown-container" id="world-cup-countdown">
      <div class="countdown-block">
        <span class="countdown-value" id="cd-days">00</span>
        <span class="countdown-label">Días</span>
      </div>
      <div class="countdown-block">
        <span class="countdown-value" id="cd-hours">00</span>
        <span class="countdown-label">Horas</span>
      </div>
      <div class="countdown-block">
        <span class="countdown-value" id="cd-mins">00</span>
        <span class="countdown-label">Min</span>
      </div>
      <div class="countdown-block">
        <span class="countdown-value" id="cd-secs">00</span>
        <span class="countdown-label">Seg</span>
      </div>
    </div>
  `;
}

export function initCountdown() {
  const targetDate = new Date('2026-06-11T13:00:00-06:00').getTime();

  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minsEl = document.getElementById('cd-mins');
  const secsEl = document.getElementById('cd-secs');

  if (!daysEl) return;

  function update() {
    const now = Date.now();
    const distance = targetDate - now;

    if (distance < 0) {
      daysEl.innerText = '00';
      return;
    }

    daysEl.innerText = String(Math.floor(distance / 86400000)).padStart(2, '0');
    hoursEl.innerText = String(Math.floor((distance % 86400000) / 3600000)).padStart(2, '0');
    minsEl.innerText = String(Math.floor((distance % 3600000) / 60000)).padStart(2, '0');
    secsEl.innerText = String(Math.floor((distance % 60000) / 1000)).padStart(2, '0');
  }

  update();
  if (window.cdInterval) clearInterval(window.cdInterval);
  window.cdInterval = setInterval(update, 1000);
}
