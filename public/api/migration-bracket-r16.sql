-- =============================================================
-- Migration: Populate Round of 16 (Octavos) bracket from ESPN
-- =============================================================
-- Source : ESPN scoreboard v2 (authoritative)
--          https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard
-- Fetched: 2026-07-02
-- Method : UPDATE-only, idempotent. Rows already exist with
--          placeholder names ("Round of 32 N Winner") from seed.
-- Safe   : Does NOT touch home_score / away_score / status / is_locked.
-- Note   : Respect ESPN home/away order EXACTLY. The cron scores
--          home vs away separately, so swapping them would
--          mis-score exact-score predictions. Abbreviations are
--          lowercased (CAN -> can) to match /logos/{abbr}.png.
-- =============================================================
-- Phase 1 (5 matches) executed 2026-07-02 by Gil in phpMyAdmin.
-- Phase 2 (3 matches) resolved by ESPN 2026-07-03 — run now to
-- complete the R16 bracket. Idempotent: re-running Phase 1 is
-- harmless (UPDATE only). Safe: predictions bind to match_id
-- (bracket slot), not team name.
-- =============================================================

-- Phase 1 — 5 matches fully resolved by ESPN as of 2026-07-02
-- (both feeder R32 games already finished).
UPDATE q_matches SET home_team='Canada',        home_abbr='can', away_team='Morocco',       away_abbr='mor' WHERE id='760502';
UPDATE q_matches SET home_team='Paraguay',      home_abbr='par', away_team='France',        away_abbr='fra' WHERE id='760503';
UPDATE q_matches SET home_team='Brazil',        home_abbr='bra', away_team='Norway',        away_abbr='nor' WHERE id='760504';
UPDATE q_matches SET home_team='Mexico',        home_abbr='mex', away_team='England',       away_abbr='eng' WHERE id='760505';
UPDATE q_matches SET home_team='United States', home_abbr='usa', away_team='Belgium',       away_abbr='bel' WHERE id='760507';

-- Phase 2 — 3 matches resolved by ESPN as of 2026-07-03
-- (all feeder R32 games finished Jul 2-4). Respect home/away
-- order returned by ESPN.
UPDATE q_matches SET home_team='Portugal',    home_abbr='por', away_team='Spain',        away_abbr='esp' WHERE id='760506';
UPDATE q_matches SET home_team='Switzerland', home_abbr='sui', away_team='Colombia',     away_abbr='col' WHERE id='760508';
UPDATE q_matches SET home_team='Argentina',   home_abbr='arg', away_team='Egypt',        away_abbr='egy' WHERE id='760509';

-- Verification (run after the UPDATEs)
SELECT id, phase, home_team, home_abbr, away_team, away_abbr, status
FROM q_matches
WHERE id IN ('760502','760503','760504','760505','760506','760507','760508','760509')
ORDER BY id;
