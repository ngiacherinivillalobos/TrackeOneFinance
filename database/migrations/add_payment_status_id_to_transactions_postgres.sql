-- Migration: Add payment_status_id column to transactions table (PostgreSQL version)
-- This migration adds the missing payment_status_id column to the transactions table

-- Add payment_status_id column to transactions table (PostgreSQL) only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'payment_status_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN payment_status_id INTEGER DEFAULT 1;
  END IF;
END $$;

-- Add foreign key constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_transactions_payment_status'
  ) THEN
    ALTER TABLE transactions ADD CONSTRAINT fk_transactions_payment_status 
      FOREIGN KEY (payment_status_id) REFERENCES payment_status(id);
  END IF;
END $$;

-- Add index for better performance
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_transactions_payment_status'
  ) THEN
    CREATE INDEX idx_transactions_payment_status ON transactions(payment_status_id);
  END IF;
END $$;