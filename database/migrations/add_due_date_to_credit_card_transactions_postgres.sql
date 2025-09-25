-- Adiciona campo due_date à tabela credit_card_transactions (PostgreSQL)
-- Esta migração adiciona o campo due_date para armazenar a data de vencimento calculada
-- Simplified for Render compatibility

-- Add due_date column to credit_card_transactions table
ALTER TABLE credit_card_transactions ADD COLUMN IF NOT EXISTS due_date DATE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_credit_card_transactions_due_date ON credit_card_transactions (due_date);

-- Comentário sobre a coluna
-- Comentários são opcionais e podem ser adicionados manualmente se necessário