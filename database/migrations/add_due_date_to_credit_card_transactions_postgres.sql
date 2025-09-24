-- Adiciona campo due_date à tabela credit_card_transactions (PostgreSQL)
-- Esta migração adiciona o campo due_date para armazenar a data de vencimento calculada

-- Adicionar coluna due_date à tabela existente
ALTER TABLE credit_card_transactions 
ADD COLUMN IF NOT EXISTS due_date DATE;

-- Adicionar índice para a nova coluna
CREATE INDEX IF NOT EXISTS idx_credit_card_transactions_due_date 
ON credit_card_transactions (due_date);

-- Comentário sobre a coluna
COMMENT ON COLUMN credit_card_transactions.due_date 
IS 'Data de vencimento calculada com base na data da transação e regras do cartão';