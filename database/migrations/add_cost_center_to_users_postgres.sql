-- Migration: Add cost_center_id to users table (PostgreSQL version)
-- This will allow users to be associated with cost centers for automatic filtering

-- Add cost_center_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS cost_center_id INTEGER REFERENCES cost_centers(id);

-- Create index for better performance on cost_center_id queries
CREATE INDEX IF NOT EXISTS idx_users_cost_center ON users(cost_center_id);