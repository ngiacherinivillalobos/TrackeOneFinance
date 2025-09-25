-- Migration: Add cost_center_id to cash_flow table (PostgreSQL version)
-- This will allow cash flow records to be associated with cost centers
-- Simplified for Render compatibility

ALTER TABLE cash_flow ADD COLUMN IF NOT EXISTS cost_center_id INTEGER;

-- Add foreign key constraint
-- Using plain ALTER TABLE ... ADD CONSTRAINT for Render compatibility
ALTER TABLE cash_flow ADD CONSTRAINT fk_cash_flow_cost_center 
  FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id);

-- Create index for better performance on cost_center_id queries
-- Using CREATE INDEX for Render compatibility
CREATE INDEX IF NOT EXISTS idx_cash_flow_cost_center ON cash_flow(cost_center_id);