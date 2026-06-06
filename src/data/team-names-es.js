/**
 * Mapa de traducción de nombres de selecciones: Inglés → Español
 * Fuente: ESPN API / teams.json / quiniela-seed.php
 * Solo para uso en frontend (no se modifica la DB)
 */

export const TEAM_NAMES_ES = {
  // ── Selecciones (48) ──
  "Algeria": "Argelia",
  "Argentina": "Argentina",
  "Australia": "Australia",
  "Austria": "Austria",
  "Belgium": "Bélgica",
  "Bosnia-Herzegovina": "Bosnia y Herzegovina",
  "Brazil": "Brasil",
  "Canada": "Canadá",
  "Cape Verde": "Cabo Verde",
  "Colombia": "Colombia",
  "Congo DR": "RD Congo",
  "Croatia": "Croacia",
  "Curacao": "Curazao",
  "Czechia": "Chequia",
  "Ecuador": "Ecuador",
  "Egypt": "Egipto",
  "England": "Inglaterra",
  "France": "Francia",
  "Germany": "Alemania",
  "Ghana": "Ghana",
  "Haiti": "Haití",
  "Iran": "Irán",
  "Iraq": "Irak",
  "Ivory Coast": "Costa de Marfil",
  "Japan": "Japón",
  "Jordan": "Jordania",
  "Mexico": "México",
  "Morocco": "Marruecos",
  "Netherlands": "Países Bajos",
  "New Zealand": "Nueva Zelanda",
  "Norway": "Noruega",
  "Panama": "Panamá",
  "Paraguay": "Paraguay",
  "Portugal": "Portugal",
  "Qatar": "Catar",
  "Saudi Arabia": "Arabia Saudita",
  "Scotland": "Escocia",
  "Senegal": "Senegal",
  "South Africa": "Sudáfrica",
  "South Korea": "Corea del Sur",
  "Spain": "España",
  "Sweden": "Suecia",
  "Switzerland": "Suiza",
  "Tunisia": "Túnez",
  "Türkiye": "Turquía",
  "United States": "Estados Unidos",
  "Uruguay": "Uruguay",
  "Uzbekistan": "Uzbekistán",

  // ── Placeholders de knockout (se reemplazan cuando ESPN actualiza) ──
  "Winner": "Ganador",
  "Loser": "Perdedor",
  "2nd Place": "2° Lugar",
  "Third Place": "3° Mejor",
  "Group": "Grupo",
  "Round of 32": "Octavos",
  "Round of 16": "Cuartos",
  "Quarterfinal": "Cuartos",
  "Semifinal": "Semifinal",
};

/**
 * Traduce un nombre de equipo del inglés al español.
 * Si no encuentra traducción, devuelve el nombre original.
 */
export function translateTeam(englishName) {
  if (!englishName) return englishName;

  // Búsqueda directa
  if (TEAM_NAMES_ES[englishName]) {
    return TEAM_NAMES_ES[englishName];
  }

  // Traducción compuesta para placeholders de knockout:
  // "Group A Winner" → "Ganador Grupo A"
  // "Group A 2nd Place" → "2° Lugar Grupo A"
  // "Third Place Group A/B/C/D/F" → "3° Mejor Grupo A/B/C/D/F"
  // "Round of 32 1 Winner" → "Ganador Octavos 1"
  // "Round of 16 3 Winner" → "Ganador Cuartos 3"
  // "Quarterfinal 1 Winner" → "Ganador Cuartos 1"
  // "Semifinal 1 Winner" → "Ganador Semifinal 1"
  // "Semifinal 1 Loser" → "Perdedor Semifinal 1"
  let translated = englishName;

  // Quarterfinal/Semifinal X Winner/Loser
  translated = translated.replace(
    /^(Quarterfinal|Semifinal) (\d+) (Winner|Loser)$/,
    (_, stage, num, result) => `${TEAM_NAMES_ES[result] || result} ${TEAM_NAMES_ES[stage] || stage} ${num}`
  );

  // Round of 32/16 X Winner
  translated = translated.replace(
    /^(Round of \d+) (\d+) (Winner)$/,
    (_, round, num, __) => `Ganador ${TEAM_NAMES_ES[round] || round} ${num}`
  );

  // Third Place Group X/Y/Z
  translated = translated.replace(
    /^(Third Place) (Group .+)$/,
    (_, place, group) => `${TEAM_NAMES_ES[place] || place} ${TEAM_NAMES_ES[group.split(' ')[0]] || group.split(' ')[0]} ${group.split(' ').slice(1).join(' ')}`
  );

  // Group X Winner / Group X 2nd Place
  translated = translated.replace(
    /^(Group \w+) (Winner|2nd Place)$/,
    (_, group, position) => {
      const posMap = { "Winner": "Ganador", "2nd Place": "2° Lugar" };
      return `${posMap[position] || position} Grupo ${group.replace('Group ', '')}`;
    }
  );

  return translated;
}
