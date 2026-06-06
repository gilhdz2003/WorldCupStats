-- =============================================================
-- Migration: Escalating Points per Phase
-- Date: 2026-06-05
-- Run this ONCE on the existing database to add escalating points.
-- =============================================================

-- Add columns to q_phases
ALTER TABLE q_phases ADD COLUMN points_correct INT NOT NULL DEFAULT 3;
ALTER TABLE q_phases ADD COLUMN points_exact INT NOT NULL DEFAULT 5;

-- Set escalating point values per phase
UPDATE q_phases SET points_correct = 3,  points_exact = 5  WHERE phase = 'groups';
UPDATE q_phases SET points_correct = 4,  points_exact = 7  WHERE phase = 'round_of_32';
UPDATE q_phases SET points_correct = 5,  points_exact = 10 WHERE phase = 'round_of_16';
UPDATE q_phases SET points_correct = 7,  points_exact = 14 WHERE phase = 'quarterfinals';
UPDATE q_phases SET points_correct = 10, points_exact = 20 WHERE phase = 'semifinals';
UPDATE q_phases SET points_correct = 15, points_exact = 30 WHERE phase = 'final';

-- Verify
SELECT phase, points_correct, points_exact FROM q_phases ORDER BY FIELD(phase, 'groups', 'round_of_32', 'round_of_16', 'quarterfinals', 'semifinals', 'final');
