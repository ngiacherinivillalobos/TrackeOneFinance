-- Migração para adicionar campos de parcelamento na tabela transactions (PostgreSQL)
-- Execute este script para adicionar os novos campos de parcelamento
-- Using DO $$ blocks for Render compatibility

DO $$
BEGIN
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'is_installment') THEN
    ALTER TABLE transactions ADD COLUMN is_installment BOOLEAN DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'installment_number') THEN
    ALTER TABLE transactions ADD COLUMN installment_number INTEGER DEFAULT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'total_installments') THEN
    ALTER TABLE transactions ADD COLUMN total_installments INTEGER DEFAULT NULL;
  END IF;
END $$;