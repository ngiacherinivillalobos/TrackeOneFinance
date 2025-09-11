-- Migration: Add payment_status_id column to transactions table (PostgreSQL version)
-- This migration adds the missing payment_status_id column to the transactions table

-- Add payment_status_id column to transactions table (PostgreSQL) only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='transactions' AND column_name='payment_status_id') THEN
    ALTER TABLE transactions ADD COLUMN payment_status_id INTEGER DEFAULT 1;
    -- Add foreign key constraint
    ALTER TABLE transactions ADD CONSTRAINT fk_transactions_payment_status 
      FOREIGN KEY (payment_status_id) REFERENCES payment_status(id);
    -- Add index for better performance
    CREATE INDEX IF NOT EXISTS idx_transactions_payment_status ON transactions(payment_status_id);
  END IF;
END $$;