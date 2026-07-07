-- =============================================================
-- Migration: Populate Quarterfinals bracket from ESPN
-- =============================================================
-- Source : ESPN scoreboard v2 (authoritative)
--          https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard
-- Fetched: 2026-07-07
-- Method : UPDATE-only, idempotent. Rows already exist with
--          placeholder names ("Round of 16 X Winner") from seed.
-- Safe   : Does NOT touch home_score / away_score / status / is_locked.
-- Note   : Respect ESPN home/away order EXACTLY (cron scores
--          home vs away separately, swapping mis-scores exacts).
--          Abbreviations lowercased (FRA -> fra) to match
--          /logos/{abbr}.png.
-- =============================================================

-- Phase 1 — 3 QF matches resolved by ESPN as of 2026-07-07
-- (6 of 8 R16 games finished).
UPDATE q_matches SET home_team='France',  home_abbr='fra', away_team='Morocco', away_abbr='mor' WHERE id='760510';
UPDATE q_matches SET home_team='Spain',   home_abbr='esp', away_team='Belgium', away_abbr='bel' WHERE id='760511';
UPDATE q_matches SET home_team='Norway',  home_abbr='nor', away_team='England', away_abbr='eng' WHERE id='760512';

-- Phase 2 — PENDING. Add UPDATE once ESPN resolves it
-- (after both feeder R16 games finish, Jul 7):
--   760513 (jul 12 01:00) — feeders: 760508 SUI/COL, 760509 ARG/EGY
-- Read home/away straight from ESPN and respect the order.
-- Example (fill when ready):
-- UPDATE q_matches SET home_team='X', home_abbr='xxx', away_team='Y', away_abbr='yyy' WHERE id='760513';

-- Verification (run after the UPDATEs)
SELECT id, phase, home_team, home_abbr, away_team, away_abbr, status
FROM q_matches
WHERE id IN ('760510','760511','760512','760513')
ORDER BY id;
