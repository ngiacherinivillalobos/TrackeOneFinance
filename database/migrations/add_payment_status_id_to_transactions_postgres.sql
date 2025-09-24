-- Migration: Add payment_status_id column to transactions table (PostgreSQL version)
-- This migration adds the missing payment_status_id column to the transactions table

-- Add payment_status_id column to transactions table (PostgreSQL)
-- Using ALTER TABLE ... ADD COLUMN IF NOT EXISTS for better Render compatibility
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_status_id INTEGER DEFAULT 1;

-- Add foreign key constraint
-- Using ALTER TABLE ... ADD CONSTRAINT IF NOT EXISTS for better Render compatibility
ALTER TABLE transactions ADD CONSTRAINT IF NOT EXISTS fk_transactions_payment_status 
  FOREIGN KEY (payment_status_id) REFERENCES payment_status(id);

-- Add index for better performance
-- Using CREATE INDEX IF NOT EXISTS for better Render compatibility
CREATE INDEX IF NOT EXISTS idx_transactions_payment_status ON transactions(payment_status_id);
