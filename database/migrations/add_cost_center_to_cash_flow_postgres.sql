-- Migration: Add cost_center_id to cash_flow table (PostgreSQL version)
-- This will allow cash flow records to be associated with cost centers

-- Add cost_center_id column to cash_flow table
ALTER TABLE cash_flow ADD COLUMN IF NOT EXISTS cost_center_id INTEGER REFERENCES cost_centers(id);

-- Create index for better performance on cost_center_id queries
CREATE INDEX IF NOT EXISTS idx_cash_flow_cost_center ON cash_flow(cost_center_id);