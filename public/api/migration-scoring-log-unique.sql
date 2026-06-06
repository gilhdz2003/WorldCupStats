-- Migration: Add UNIQUE constraint on q_scoring_log (match_id, user_id)
-- Prevents duplicate log entries when recalculate is called.
-- Date: June 2026
-- Run BEFORE the tournament starts (no scoring data exists yet).

-- Step 1: Clean any potential duplicates (safety measure, should be empty pre-tournament)
DELETE sl1 FROM q_scoring_log sl1
INNER JOIN q_scoring_log sl2
WHERE sl1.id < sl2.id
  AND sl1.match_id = sl2.match_id
  AND sl1.user_id = sl2.user_id;

-- Step 2: Add unique constraint
ALTER TABLE q_scoring_log
ADD UNIQUE KEY uk_match_user (match_id, user_id);
