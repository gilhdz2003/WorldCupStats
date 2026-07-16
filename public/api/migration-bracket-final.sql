-- =============================================================
-- Migration: Populate Final + 3rd-Place bracket from ESPN
-- =============================================================
-- Source : ESPN scoreboard v2 (authoritative)
--          https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard
-- Fetched: 2026-07-15
-- Method : UPDATE-only, idempotent. Rows already exist with
--          placeholder names ("Semifinal X Winner/Loser") from seed.
-- Safe   : Does NOT touch home_score / away_score / status / is_locked.
--          Predictions bind to match_id (slot), not team name, so
--          populating teams does NOT invalidate existing predictions.
-- Note   : Respect ESPN home/away order EXACTLY (cron scores
--          home vs away separately, swapping mis-scores exacts).
--          Abbreviations lowercased (FRA -> fra) to match
--          /logos/{abbr}.png.
-- =============================================================

-- Both Semifinals finished (Jul 14-15, 2026). ESPN resolved both
-- the 3rd-Place and Final slots:
--   760514  FRA 0-2 ESP [FT]  → Spain advances     (France to 3rd)
--   760515  ENG 1-2 ARG [FT]  → Argentina advances  (England to 3rd)
-- ESPN placed (verified via scoreboard --dates 20260718-20260719):
--   3rd-Place (Jul 18): France    (home) vs England    (away)
--   Final      (Jul 19): Spain     (home) vs Argentina (away)
-- Respect that order EXACTLY (cron scores home vs away separately).
-- Order matches the structural seed (SF L1/L2, SFW1/SFW2) — no swap.

-- 3rd-Place — Jul 18: France (home) vs England (away)
UPDATE q_matches SET home_team='France',  home_abbr='fra', away_team='England',    away_abbr='eng' WHERE id='760516';

-- Final — Jul 19: Spain (home) vs Argentina (away)
UPDATE q_matches SET home_team='Spain',   home_abbr='esp', away_team='Argentina', away_abbr='arg' WHERE id='760517';

-- Verification (run after the UPDATEs)
SELECT id, phase, home_team, home_abbr, away_team, away_abbr, status
FROM q_matches
WHERE id IN ('760516','760517')
ORDER BY id;
