-- Migration: Add cost_center_id to cash_flow table (PostgreSQL version)
-- This will allow cash flow records to be associated with cost centers

-- Add cost_center_id column to cash_flow table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cash_flow' AND column_name = 'cost_center_id'
  ) THEN
    ALTER TABLE cash_flow ADD COLUMN cost_center_id INTEGER REFERENCES cost_centers(id);
  END IF;
END $$;

-- Create index for better performance on cost_center_id queries
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_cash_flow_cost_center'
  ) THEN
    CREATE INDEX idx_cash_flow_cost_center ON cash_flow(cost_center_id);
  END IF;
END $$;