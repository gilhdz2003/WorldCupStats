-- Migration: Leaderboard Especial
-- Adds is_especial flag to q_users to mark participants
-- who belong to the "Especial" private league.
-- Date: June 2026

ALTER TABLE q_users ADD COLUMN is_especial TINYINT(1) DEFAULT 0 AFTER is_admin;
CREATE INDEX idx_is_especial ON q_users (is_especial);

-- Marcar los 15 participantes (ejecutar DESPUÉS de verificar los IDs)
-- UPDATE q_users SET is_especial = 1 WHERE id IN (/* IDs de los 15 */);
