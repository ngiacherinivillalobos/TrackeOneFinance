-- Migration: Add payment_date column to transactions table (PostgreSQL)
-- This will allow storing the payment date directly in the transactions table for easier querying
-- Using DO $$ blocks for Render compatibility

DO $$
BEGIN
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'payment_date') THEN
    ALTER TABLE transactions ADD COLUMN payment_date DATE;
  END IF;
END $$;

-- Add index for better performance
-- Using DO $$ blocks for Render compatibility
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace 
                 WHERE c.relname = 'idx_transactions_payment_date' AND n.nspname = current_schema()) THEN
    CREATE INDEX idx_transactions_payment_date ON transactions(payment_date);
  END IF;
END $$;