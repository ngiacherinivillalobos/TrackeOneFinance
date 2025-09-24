-- Migration: Add investment type support to transactions table (PostgreSQL version)
-- This migration modifies the CHECK constraint to include 'investment' type
-- Note: Using 'type' column with English values to match SQLite structure

-- PostgreSQL supports ALTER TABLE to modify constraints directly
DO $$ 
BEGIN
  -- Remover constraint existente se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'transactions_type_check' AND table_name = 'transactions'
  ) THEN
    ALTER TABLE transactions DROP CONSTRAINT transactions_type_check;
  END IF;
  
  -- Adicionar nova constraint com valores atualizados
  ALTER TABLE transactions 
  ADD CONSTRAINT transactions_type_check 
  CHECK (type IN ('expense', 'income', 'investment'));
END $$;