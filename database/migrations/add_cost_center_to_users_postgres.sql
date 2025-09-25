-- Migration: Add cost_center_id to users table (PostgreSQL version)
-- This will allow users to be associated with cost centers for automatic filtering
-- Simplified for Render compatibility

ALTER TABLE users ADD COLUMN IF NOT EXISTS cost_center_id INTEGER;

-- Add foreign key constraint
-- Using ALTER TABLE ... ADD CONSTRAINT for Render compatibility
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS fk_users_cost_center 
  FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id);

-- Create index for better performance on cost_center_id queries
-- Using CREATE INDEX for Render compatibility
CREATE INDEX IF NOT EXISTS idx_users_cost_center ON users(cost_center_id);