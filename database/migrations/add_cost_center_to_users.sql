-- Migration: Add cost_center_id to users table
-- This will allow users to be associated with cost centers for automatic filtering

-- Create a new table with the desired structure
CREATE TABLE users_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    cost_center_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id)
);

-- Copy data from the old table to the new table
INSERT INTO users_new (id, email, password, created_at)
SELECT id, email, password, created_at
FROM users;

-- Drop the old table
DROP TABLE users;

-- Rename the new table to the original name
ALTER TABLE users_new RENAME TO users;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_users_cost_center ON users(cost_center_id);