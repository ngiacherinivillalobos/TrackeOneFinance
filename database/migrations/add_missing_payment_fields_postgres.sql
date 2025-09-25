-- Migration: Add missing payment fields to transactions table (PostgreSQL version)
-- This migration adds all payment-related fields that exist in SQLite but may be missing in PostgreSQL
-- Simplified for Render compatibility

-- Add bank_account_id and card_id for payment methods
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS bank_account_id INTEGER;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS card_id INTEGER;

-- Add additional payment fields
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(10,2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_type TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_observations TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS discount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS interest NUMERIC(10,2) DEFAULT 0;

-- Add foreign key constraints
-- Using ALTER TABLE ... ADD CONSTRAINT for Render compatibility
ALTER TABLE transactions ADD CONSTRAINT IF NOT EXISTS fk_transactions_bank_account 
  FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id);
ALTER TABLE transactions ADD CONSTRAINT IF NOT EXISTS fk_transactions_card 
  FOREIGN KEY (card_id) REFERENCES cards(id);

-- Create indexes for better performance
-- Using CREATE INDEX for Render compatibility
CREATE INDEX IF NOT EXISTS idx_transactions_bank_account ON transactions(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_card ON transactions(card_id);
