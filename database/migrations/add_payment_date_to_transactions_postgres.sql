-- Migration: Add payment_date column to transactions table (PostgreSQL)
-- This will allow storing the payment date directly in the transactions table for easier querying

-- Add payment_date column to transactions table (PostgreSQL) only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'payment_date'
  ) THEN
    ALTER TABLE transactions ADD COLUMN payment_date DATE;
  END IF;
END $$;

-- Add index for better performance
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_transactions_payment_date'
  ) THEN
    CREATE INDEX idx_transactions_payment_date ON transactions(payment_date);
  END IF;
END $$;