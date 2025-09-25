-- Migration: Add missing payment fields to transactions table (PostgreSQL version)
-- This migration adds all payment-related fields that exist in SQLite but may be missing in PostgreSQL
-- Using DO $$ blocks for Render compatibility

DO $$
BEGIN
  -- Add bank_account_id and card_id for payment methods
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'bank_account_id') THEN
    ALTER TABLE transactions ADD COLUMN bank_account_id INTEGER;
  END IF;
  
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'card_id') THEN
    ALTER TABLE transactions ADD COLUMN card_id INTEGER;
  END IF;

  -- Add additional payment fields
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'paid_amount') THEN
    ALTER TABLE transactions ADD COLUMN paid_amount NUMERIC(10,2);
  END IF;
  
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'payment_type') THEN
    ALTER TABLE transactions ADD COLUMN payment_type TEXT;
  END IF;
  
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'payment_observations') THEN
    ALTER TABLE transactions ADD COLUMN payment_observations TEXT;
  END IF;
  
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'discount') THEN
    ALTER TABLE transactions ADD COLUMN discount NUMERIC(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'interest') THEN
    ALTER TABLE transactions ADD COLUMN interest NUMERIC(10,2) DEFAULT 0;
  END IF;
END $$;

-- Add foreign key constraints
-- Using DO $$ blocks for Render compatibility
DO $$
BEGIN
  -- Check if constraint exists before adding
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'fk_transactions_bank_account' AND table_name = 'transactions') THEN
    -- Usando bloco DO $$ com verificação condicional para compatibilidade com Render
    ALTER TABLE transactions ADD CONSTRAINT fk_transactions_bank_account 
      FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id);
  END IF;
END $$;

DO $$
BEGIN
  -- Check if constraint exists before adding
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE constraint_name = 'fk_transactions_card' AND table_name = 'transactions') THEN
    -- Usando bloco DO $$ com verificação condicional para compatibilidade com Render
    ALTER TABLE transactions ADD CONSTRAINT fk_transactions_card 
      FOREIGN KEY (card_id) REFERENCES cards(id);
  END IF;
END $$;

-- Create indexes for better performance
-- Using DO $$ blocks for Render compatibility
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace 
                 WHERE c.relname = 'idx_transactions_bank_account' AND n.nspname = current_schema()) THEN
    CREATE INDEX idx_transactions_bank_account ON transactions(bank_account_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace 
                 WHERE c.relname = 'idx_transactions_card' AND n.nspname = current_schema()) THEN
    CREATE INDEX idx_transactions_card ON transactions(card_id);
  END IF;
END $$;