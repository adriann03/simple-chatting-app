-- Create Database
CREATE DATABASE IF NOT EXISTS atmosphere_db;
USE atmosphere_db;

-- Create cloud_groups table
CREATE TABLE IF NOT EXISTS cloud_groups (
    group_id VARCHAR(255) PRIMARY KEY,
    group_name VARCHAR(255) NOT NULL,
    frequency_key VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create cloud_messages table for Real-Time Chat Backup
CREATE TABLE IF NOT EXISTS cloud_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id VARCHAR(255) UNIQUE NOT NULL,
    chat_id VARCHAR(255) NOT NULL,
    sender_id VARCHAR(255) NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    message_text TEXT,
    media_data LONGTEXT,
    file_name VARCHAR(255),
    timestamp BIGINT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
