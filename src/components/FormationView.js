const POSITIONS_MAP = {
  'GK': { label: 'PO', color: 'var(--accent-info)' },
  'CB': { label: 'DC', color: 'var(--accent-success)' },
  'LB': { label: 'LI', color: 'var(--accent-success)' },
  'RB': { label: 'LD', color: 'var(--accent-success)' },
  'LWB': { label: 'CI', color: 'var(--accent-success)' },
  'RWB': { label: 'CD', color: 'var(--accent-success)' },
  'CM': { label: 'MC', color: 'var(--accent-secondary)' },
  'CDM': { label: 'MCD', color: 'var(--accent-secondary)' },
  'CAM': { label: 'MCO', color: 'var(--accent-secondary)' },
  'LM': { label: 'MI', color: 'var(--accent-secondary)' },
  'RM': { label: 'MD', color: 'var(--accent-secondary)' },
  'LW': { label: 'EI', color: 'var(--accent-danger)' },
  'RW': { label: 'ED', color: 'var(--accent-danger)' },
  'ST': { label: 'DC', color: 'var(--accent-danger)' },
  'CF': { label: 'DEL', color: 'var(--accent-danger)' },
};

export function renderFormation(formation, teamName, players = []) {
  if (!formation) return '';

  const lines = formation.split('-').map(Number);
  const totalLines = lines.length + 1; // +1 for GK

  const positionSlots = [];
  positionSlots.push({ pos: 'GK', line: 0 });

  const midPositions = {
    4: ['LB', 'CB', 'CB', 'RB'],
    3: ['CB', 'CB', 'CB'],
    5: ['LWB', 'CB', 'CB', 'CB', 'RWB'],
    2: ['CB', 'CB'],
    1: ['CB'],
  };

  const midPosNames = {
    3: ['CM', 'CM', 'CM'],
    2: ['CDM', 'CAM'],
    4: ['LM', 'CM', 'CM', 'RM'],
    1: ['CDM'],
    5: ['LM', 'CM', 'CDM', 'CM', 'RM'],
  };

  const fwdPosNames = {
    1: ['ST'],
    2: ['LW', 'RW'],
    3: ['LW', 'ST', 'RW'],
  };

  lines.forEach((count, lineIdx) => {
    const lineNum = lineIdx + 1;
    const isDefense = lineIdx === 0;
    const isForward = lineIdx === lines.length - 1;

    for (let i = 0; i < count; i++) {
      let posCode;
      if (isDefense) {
        posCode = (midPositions[count] || ['CB'])[i] || 'CB';
      } else if (isForward) {
        posCode = (fwdPosNames[count] || ['ST'])[i] || 'ST';
      } else {
        posCode = (midPosNames[count] || ['CM'])[i] || 'CM';
      }
      positionSlots.push({ pos: posCode, line: lineNum });
    }
  });

  const playerEls = positionSlots.map((slot, idx) => {
    const posInfo = POSITIONS_MAP[slot.pos] || { label: slot.pos, color: 'var(--text-muted)' };
    const playerName = players[idx]?.name?.split(' ').pop() || '';
    const yPos = ((totalLines - slot.line) / totalLines) * 100;
    const slotsInLine = positionSlots.filter(s => s.line === slot.line).length;
    const slotIdx = positionSlots.filter(s => s.line === slot.line).indexOf(slot);
    const xPos = ((slotIdx + 0.5) / slotsInLine) * 100;

    return `
      <div class="formation-player" style="left: ${xPos}%; bottom: ${yPos}%;">
        <div class="formation-dot" style="background: ${posInfo.color};">${posInfo.label}</div>
        ${playerName ? `<div class="formation-name">${playerName}</div>` : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="formation-panel">
      <div class="formation-label">${teamName} — ${formation}</div>
      <div class="formation-field">
        <div class="formation-center-line"></div>
        <div class="formation-center-circle"></div>
        ${playerEls}
      </div>
    </div>
  `;
}
