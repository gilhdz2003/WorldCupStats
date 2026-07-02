-- =============================================================
-- Migration: Open ALL remaining phases (committee decision, 2 Jul)
-- =============================================================
-- Decision : Participants may predict future rounds NOW, even for
--            matches whose teams aren't confirmed yet (placeholders
--            like "Round of 16 X Winner"). Safe because predictions
--            bind to match_id (bracket slot) — populating teams
--            later keeps existing predictions valid for the slot.
-- Matches  : All rows already exist (R16, QF, SF, 3rd, Final) from
--            the seed; no INSERT needed.
-- Frontend : Reads open_phases dynamically -> NO deploy/rebuild/SW
--            bump needed; tabs enable on next getMatches() fetch.
-- =============================================================

-- 1) Open remaining phases
UPDATE q_phases SET is_open = 1
WHERE phase IN ('round_of_16','quarterfinals','semifinals','final');

-- 2) OPTIONAL but RECOMMENDED: close finished phases so R16 is the
--    DEFAULT tab on load. Otherwise users land on "Fase de Grupos"
--    (already over) and must switch tabs manually. Comment out if
--    you prefer to keep Groups + R32 visible.
UPDATE q_phases SET is_open = 0
WHERE phase IN ('groups','round_of_32');

-- Verification
SELECT phase, is_open, points_correct, points_exact
FROM q_phases
ORDER BY FIELD(phase,'groups','round_of_32','round_of_16','quarterfinals','semifinals','final');
