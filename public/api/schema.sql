-- Mundial 2026 — Comments table
-- Run this in Hostinger MySQL panel (phpMyAdmin or CLI)

CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    thread_id VARCHAR(50) NOT NULL,
    author VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    ip_address VARCHAR(45) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_thread (thread_id),
    INDEX idx_ip_rate (ip_address, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
