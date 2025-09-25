-- Migration: Add cash_flow table for daily cash flow records (PostgreSQL version)
-- This table will store simple daily cash flow entries
-- Simplified for Render compatibility

-- Create table if not exists
CREATE TABLE IF NOT EXISTS cash_flow (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    record_type TEXT NOT NULL CHECK (record_type IN ('Despesa', 'Receita')),
    category_id INTEGER,
    subcategory_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints
-- Using ALTER TABLE ... ADD CONSTRAINT for Render compatibility
ALTER TABLE cash_flow ADD CONSTRAINT IF NOT EXISTS fk_cash_flow_category 
  FOREIGN KEY (category_id) REFERENCES categories(id);
ALTER TABLE cash_flow ADD CONSTRAINT IF NOT EXISTS fk_cash_flow_subcategory 
  FOREIGN KEY (subcategory_id) REFERENCES subcategories(id);

-- Create indexes for better performance on date queries
-- Using CREATE INDEX for Render compatibility
CREATE INDEX IF NOT EXISTS idx_cash_flow_date ON cash_flow(date);
CREATE INDEX IF NOT EXISTS idx_cash_flow_record_type ON cash_flow(record_type);