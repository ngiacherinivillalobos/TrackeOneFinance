-- Migration: Add payment_status_id column to transactions table (PostgreSQL version)
-- This migration adds the missing payment_status_id column to the transactions table
-- Simplified for Render compatibility

-- Add payment_status_id column to transactions table (PostgreSQL)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_status_id INTEGER DEFAULT 1;

-- Add foreign key constraint
-- Using plain ALTER TABLE ... ADD CONSTRAINT for Render compatibility
ALTER TABLE transactions ADD CONSTRAINT fk_transactions_payment_status 
  FOREIGN KEY (payment_status_id) REFERENCES payment_status(id);

-- Add index for better performance
-- Using CREATE INDEX for Render compatibility
CREATE INDEX IF NOT EXISTS idx_transactions_payment_status ON transactions(payment_status_id);