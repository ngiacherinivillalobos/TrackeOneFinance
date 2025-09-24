-- Migration: Add cost_center_id to users table (PostgreSQL version)
-- This will allow users to be associated with cost centers for automatic filtering

-- Add cost_center_id column to users table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'cost_center_id'
  ) THEN
    ALTER TABLE users ADD COLUMN cost_center_id INTEGER REFERENCES cost_centers(id);
  END IF;
END $$;

-- Create index for better performance on cost_center_id queries
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_users_cost_center'
  ) THEN
    CREATE INDEX idx_users_cost_center ON users(cost_center_id);
  END IF;
END $$;