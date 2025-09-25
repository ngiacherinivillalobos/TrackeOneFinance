-- Migration: Add payment_status_id column to transactions table (PostgreSQL version)
-- This migration adds the missing payment_status_id column to the transactions table
-- Using DO $$ blocks for Render compatibility

DO $$
BEGIN
  -- Add payment_status_id column to transactions table (PostgreSQL)
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'payment_status_id') THEN
    ALTER TABLE transactions ADD COLUMN payment_status_id INTEGER DEFAULT 1;
  END IF;
END $$;

-- Add foreign key constraint
-- Using DO $$ blocks for Render compatibility
DO $$
BEGIN
  -- Check if constraint exists before adding
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'fk_transactions_payment_status' AND table_name = 'transactions') THEN
    -- Usando bloco DO $$ com verificação condicional para compatibilidade com Render
    ALTER TABLE transactions ADD CONSTRAINT fk_transactions_payment_status 
      FOREIGN KEY (payment_status_id) REFERENCES payment_status(id);
  END IF;
END $$;

-- Add index for better performance
-- Using DO $$ blocks for Render compatibility
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace 
                 WHERE c.relname = 'idx_transactions_payment_status' AND n.nspname = current_schema()) THEN
    CREATE INDEX idx_transactions_payment_status ON transactions(payment_status_id);
  END IF;
END $$;