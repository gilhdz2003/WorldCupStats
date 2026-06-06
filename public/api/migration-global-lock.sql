-- Migration: Global predictions lock (master switch)
-- Allows admin to block ALL predictions with a single toggle.
-- Date: June 2026

CREATE TABLE IF NOT EXISTS q_config (
    key_name VARCHAR(50) PRIMARY KEY,
    value VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO q_config (key_name, value) VALUES ('predictions_locked', '0');
