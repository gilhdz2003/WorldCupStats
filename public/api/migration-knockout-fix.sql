-- =============================================================
-- Migration: Fix Knockout Phases + Add Missing Matches
-- Date: 2026-06-05
-- Purpose: 760512 and 760513 were mislabeled as SF/Final (they're QF)
--          Plus 4 missing knockout matches from ESPN (760514-760517)
-- Run this ONCE on the existing database.
-- SAFE: No scoring has occurred yet (no finished matches).
-- =============================================================

-- ═══ STEP 1: Fix mislabeled phases ═══
-- These matches have "Round of 16 X Winner" teams but are Quarterfinals, not SF/Final.
-- Since no scoring has happened yet, changing phase is safe.

UPDATE q_matches
SET phase = 'quarterfinals'
WHERE id = '760512';

UPDATE q_matches
SET phase = 'quarterfinals'
WHERE id = '760513';

-- ═══ STEP 2: Insert 4 missing matches ═══
-- IDs from ESPN API. No predictions exist for these yet.

INSERT INTO q_matches (id, phase, home_team, away_team, match_date, match_time, status, is_locked)
VALUES
  ('760514', 'semifinals', 'Quarterfinal 1 Winner', 'Quarterfinal 2 Winner', '2026-07-14', '2026-07-14 19:00:00', 'scheduled', 0),
  ('760515', 'semifinals', 'Quarterfinal 3 Winner', 'Quarterfinal 4 Winner', '2026-07-15', '2026-07-15 19:00:00', 'scheduled', 0),
  ('760516', 'final',       'Semifinal 1 Loser',     'Semifinal 2 Loser',     '2026-07-18', '2026-07-18 21:00:00', 'scheduled', 0),
  ('760517', 'final',       'Semifinal 1 Winner',     'Semifinal 2 Winner',     '2026-07-19', '2026-07-19 19:00:00', 'scheduled', 0);

-- ═══ STEP 3: Verify ═══
SELECT id, phase, home_team, away_team, match_date
FROM q_matches
WHERE phase IN ('quarterfinals', 'semifinals', 'final')
ORDER BY match_date, match_time;
