import matchesData from '../data/matches.json';

const DAY_NAMES = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const MONTH_NAMES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

function getMatchDates() {
  const uniqueDates = [...new Set(matchesData.map(m => m.date))].sort();
  return uniqueDates.map(dateStr => {
    const d = new Date(dateStr + 'T12:00:00');
    return {
      id: dateStr,
      day: DAY_NAMES[d.getDay()],
      label: `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`
    };
  });
}

export function renderDateNav(activeDate) {
  const dates = getMatchDates();
  return dates.map(d => `
    <button class="date-tab ${d.id === activeDate ? 'active' : ''}" data-date="${d.id}">
      <span class="date-day">${d.day}</span>
      <span class="date-date">${d.label}</span>
    </button>
  `).join('');
}
