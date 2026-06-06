export function renderLeaderboardTable(leaderboard, selfId) {
  if (!leaderboard.length) return '<p class="q-muted">No hay participantes aún.</p>';

  return `
    <div class="q-table-wrapper">
      <table class="q-table q-leaderboard">
        <thead>
          <tr>
            <th class="q-th-rank">#</th>
            <th>Nombre</th>
            <th class="q-th-pts">Puntos</th>
            <th class="q-th-exact">Marcadores</th>
            <th class="q-th-correct">Resultados</th>
          </tr>
        </thead>
        <tbody>
          ${leaderboard.map((u, i) => {
            const rank = u.rank || (i + 1);
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
            const isSelf = u.id === selfId;
            const selfClass = isSelf ? ' q-lb-row--self' : '';
            const topClass = rank <= 3 ? ` q-lb-row--top${rank}` : '';
            return `
              <tr class="q-lb-row${selfClass}${topClass}">
                <td class="q-rank-cell">${medal}</td>
                <td>${u.name}${isSelf ? ' <span class="q-self-badge">(TÚ)</span>' : ''}</td>
                <td class="q-pts-cell">${u.total_points}</td>
                <td class="q-lb-num">${u.exact_scores}</td>
                <td class="q-lb-num">${u.correct_results}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
    <p class="q-muted">Total: ${leaderboard.length} participantes</p>
  `;
}
