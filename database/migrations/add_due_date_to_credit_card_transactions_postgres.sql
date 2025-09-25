-- Adiciona campo due_date à tabela credit_card_transactions (PostgreSQL)
-- Esta migração adiciona o campo due_date para armazenar a data de vencimento calculada
-- Using DO $$ blocks for Render compatibility

DO $$
BEGIN
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'credit_card_transactions' AND column_name = 'due_date') THEN
    ALTER TABLE credit_card_transactions ADD COLUMN due_date DATE;
  END IF;
END $$;

-- Adicionar índice para a nova coluna
-- Using DO $$ blocks for Render compatibility
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace 
                 WHERE c.relname = 'idx_credit_card_transactions_due_date' AND n.nspname = current_schema()) THEN
    CREATE INDEX idx_credit_card_transactions_due_date ON credit_card_transactions (due_date);
  END IF;
END $$;

-- Comentário sobre a coluna
-- Comentários são opcionais e podem ser adicionados manualmente se necessário