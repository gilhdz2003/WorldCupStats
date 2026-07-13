-- =============================================================
-- Migration: Populate Semifinals bracket from ESPN
-- =============================================================
-- Source : ESPN scoreboard v2 (authoritative)
--          https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard
-- Fetched: 2026-07-13
-- Method : UPDATE-only, idempotent. Rows already exist with
--          placeholder names ("Quarterfinal X Winner") from seed.
-- Safe   : Does NOT touch home_score / away_score / status / is_locked.
--          Predictions bind to match_id (slot), not team name, so
--          populating teams does NOT invalidate existing predictions.
-- Note   : Respect ESPN home/away order EXACTLY (cron scores
--          home vs away separately, swapping mis-scores exacts).
--          Abbreviations lowercased (FRA -> fra) to match
--          /logos/{abbr}.png.
-- =============================================================

-- All 4 Quarterfinals finished (Jul 9-12, 2026). ESPN resolved
-- both Semifinal slots with the QF winners:
--   760510  FRA 2-0 MOR [FT]   → France advances
--   760511  ESP 2-1 BEL [FT]   → Spain advances
--   760512  NOR 1-2 ENG [AET]  → England advances (extra time)
--   760513  ARG 3-1 SUI [AET]  → Argentina advances (extra time)
-- ESPN placed France/Spain and England/Argentina as HOME/AWAY.
-- Respect that order EXACTLY (cron scores home vs away separately).

-- SF 1 — Jul 14: France (home) vs Spain (away)
UPDATE q_matches SET home_team='France',  home_abbr='fra', away_team='Spain',     away_abbr='esp' WHERE id='760514';

-- SF 2 — Jul 15: England (home) vs Argentina (away)
UPDATE q_matches SET home_team='England', home_abbr='eng', away_team='Argentina', away_abbr='arg' WHERE id='760515';

-- Verification (run after the UPDATEs)
SELECT id, phase, home_team, home_abbr, away_team, away_abbr, status
FROM q_matches
WHERE id IN ('760514','760515')
ORDER BY id;
