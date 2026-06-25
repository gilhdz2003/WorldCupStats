-- Migration: Fix match_date to CDT (Mexico City) local date
-- Fecha: 2026-06-11
--
-- Problema: match_date usa fecha UTC del kickoff. Un partido a las 9 PM CDT
-- (ej: Corea vs Chequia, kickoff 2026-06-12T02:00Z) tiene match_date = '2026-06-12'
-- pero se juega el 11 de Junio en Mexico.
--
-- Solucion: Restar 1 dia a match_date cuando match_time esta entre
-- medianoche y 7 AM UTC (es decir, la tarde/noche anterior en CDT).
--
-- SEGURIDAD: Solo afecta partidos con status = 'scheduled'.
-- Partidos ya terminados (finished) NO se tocan.
-- match_time (DATETIME UTC) permanece intacto — el cron usa ese campo.

UPDATE q_matches
SET match_date = DATE_SUB(match_date, INTERVAL 1 DAY)
WHERE TIME(match_time) BETWEEN '00:00:00' AND '06:59:59'
  AND status = 'scheduled';

-- Verificacion: June 11 debe tener 2 partidos
-- SELECT id, home_team, away_team, match_date, match_time FROM q_matches WHERE match_date = '2026-06-11' ORDER BY match_time;
