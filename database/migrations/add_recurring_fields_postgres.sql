-- Migração para adicionar campos de recorrência na tabela transactions (PostgreSQL)
-- Execute este script para adicionar os novos campos de recorrência
-- Using DO $$ blocks for Render compatibility

DO $$
BEGIN
  -- Adicionar campos de recorrência à tabela transactions existente
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'is_recurring') THEN
    ALTER TABLE transactions ADD COLUMN is_recurring BOOLEAN DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'recurrence_type') THEN
    ALTER TABLE transactions ADD COLUMN recurrence_type TEXT CHECK (recurrence_type IN ('unica', 'mensal', 'fixo', 'personalizado'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'recurrence_count') THEN
    ALTER TABLE transactions ADD COLUMN recurrence_count INTEGER DEFAULT 1;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'recurrence_end_date') THEN
    ALTER TABLE transactions ADD COLUMN recurrence_end_date DATE;
  END IF;
END $$;