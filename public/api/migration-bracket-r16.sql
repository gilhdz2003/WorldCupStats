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
-- EXECUTE PHASE 1 NOW (2026-07-02): committee opened all phases,
-- so populating the 5 resolved matches improves UX for people
-- predicting today. PHASE 2 (3 pending) is appended + run later,
-- once ESPN resolves them. Safe either way: predictions bind to
-- match_id (bracket slot), not team name.
-- =============================================================

-- Phase 1 — 5 matches fully resolved by ESPN as of 2026-07-02
-- (both feeder R32 games already finished).
UPDATE q_matches SET home_team='Canada',        home_abbr='can', away_team='Morocco',       away_abbr='mor' WHERE id='760502';
UPDATE q_matches SET home_team='Paraguay',      home_abbr='par', away_team='France',        away_abbr='fra' WHERE id='760503';
UPDATE q_matches SET home_team='Brazil',        home_abbr='bra', away_team='Norway',        away_abbr='nor' WHERE id='760504';
UPDATE q_matches SET home_team='Mexico',        home_abbr='mex', away_team='England',       away_abbr='eng' WHERE id='760505';
UPDATE q_matches SET home_team='United States', home_abbr='usa', away_team='Belgium',       away_abbr='bel' WHERE id='760507';

-- Phase 2 — PENDING. Add UPDATEs here once ESPN resolves them
-- (after their feeder R32 games finish, Jul 2-4). Do NOT guess
-- the teams — read home/away straight from ESPN scoreboard for
-- these IDs and respect the order ESPN returns.
--
--   760506 (jul 6 19:00) — feeders: 760497 ESP/AUT, 760496 POR/CRO
--   750508 (jul 7 20:00) — feeders: 760498 SUI/ALG, 760500 ARG/CPV
--   760509 (jul 7 16:00) — feeders: 760499 AUS/EGY, 760501 COL/GHA
--
-- Example (fill when ready):
-- UPDATE q_matches SET home_team='X', home_abbr='xxx', away_team='Y', away_abbr='yyy' WHERE id='760506';
-- UPDATE q_matches SET home_team='X', home_abbr='xxx', away_team='Y', away_abbr='yyy' WHERE id='760508';
-- UPDATE q_matches SET home_team='X', home_abbr='xxx', away_team='Y', away_abbr='yyy' WHERE id='760509';

-- Verification (run after the UPDATEs)
SELECT id, phase, home_team, home_abbr, away_team, away_abbr, status
FROM q_matches
WHERE id IN ('760502','760503','760504','760505','760506','760507','760508','760509')
ORDER BY id;
