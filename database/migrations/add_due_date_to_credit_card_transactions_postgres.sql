-- Adiciona campo due_date à tabela credit_card_transactions (PostgreSQL)
-- Esta migração adiciona o campo due_date para armazenar a data de vencimento calculada

-- Adicionar coluna due_date à tabela existente
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'credit_card_transactions' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE credit_card_transactions ADD COLUMN due_date DATE;
  END IF;
END $$;

-- Adicionar índice para a nova coluna
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_credit_card_transactions_due_date'
  ) THEN
    CREATE INDEX idx_credit_card_transactions_due_date 
    ON credit_card_transactions (due_date);
  END IF;
END $$;

-- Comentário sobre a coluna
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_description pd
    JOIN pg_class pc ON pd.objoid = pc.oid
    JOIN pg_attribute pa ON pd.objoid = pa.attrelid AND pd.objsubid = pa.attnum
    WHERE pc.relname = 'credit_card_transactions' AND pa.attname = 'due_date'
  ) THEN
    COMMENT ON COLUMN credit_card_transactions.due_date 
    IS 'Data de vencimento calculada com base na data da transação e regras do cartão';
  END IF;
END $$;