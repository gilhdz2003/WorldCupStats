-- =============================================================
-- Quiniela Mundial 2026 - MySQL Database Schema
-- =============================================================
-- 6 tables for the FIFA World Cup 2026 prediction game.
-- Run this script on your Hostinger MySQL database (u598700273_mundial2026)
-- BEFORE running quiniela-seed.php to populate match data.
-- =============================================================

DROP TABLE IF EXISTS q_scoring_log;
DROP TABLE IF EXISTS q_predictions;
DROP TABLE IF EXISTS q_sessions;
DROP TABLE IF EXISTS q_phases;
DROP TABLE IF EXISTS q_matches;
DROP TABLE IF EXISTS q_users;

-- Users table
CREATE TABLE q_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    pin VARCHAR(255) NOT NULL,  -- bcrypt hash from password_hash()
    email_verified TINYINT(1) DEFAULT 0,
    verification_code CHAR(6) DEFAULT NULL,
    verification_expires DATETIME DEFAULT NULL,
    is_admin TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME DEFAULT NULL,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Matches (seeded from matches.json)
CREATE TABLE q_matches (
    id VARCHAR(20) PRIMARY KEY,
    phase ENUM('groups','round_of_32','round_of_16','quarterfinals','semifinals','final') NOT NULL,
    group_label CHAR(1) DEFAULT NULL,
    home_team VARCHAR(100) NOT NULL,
    away_team VARCHAR(100) NOT NULL,
    match_date DATE NOT NULL,
    match_time DATETIME NOT NULL,
    home_score INT DEFAULT NULL,
    away_score INT DEFAULT NULL,
    status ENUM('scheduled','in_progress','finished','postponed','cancelled') DEFAULT 'scheduled',
    is_locked TINYINT(1) DEFAULT 0,
    INDEX idx_phase_date (phase, match_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Predictions
CREATE TABLE q_predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    match_id VARCHAR(20) NOT NULL,
    predicted_result ENUM('home','draw','away') NOT NULL,
    predicted_home_score INT DEFAULT NULL,
    predicted_away_score INT DEFAULT NULL,
    points_earned INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_match (user_id, match_id),
    FOREIGN KEY (user_id) REFERENCES q_users(id) ON DELETE CASCADE,
    FOREIGN KEY (match_id) REFERENCES q_matches(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Phases control
CREATE TABLE q_phases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phase ENUM('groups','round_of_32','round_of_16','quarterfinals','semifinals','final') NOT NULL UNIQUE,
    is_open TINYINT(1) DEFAULT 0,
    opens_at DATETIME DEFAULT NULL,
    closes_at DATETIME DEFAULT NULL,
    points_correct INT NOT NULL DEFAULT 3,
    points_exact INT NOT NULL DEFAULT 5
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Scoring audit log
CREATE TABLE q_scoring_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id VARCHAR(20) NOT NULL,
    user_id INT NOT NULL,
    points_awarded INT NOT NULL,
    reason ENUM('correct_result','exact_score') NOT NULL,
    scored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES q_matches(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sessions
CREATE TABLE q_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES q_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
