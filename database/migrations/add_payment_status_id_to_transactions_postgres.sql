-- Migration: Add payment_status_id column to transactions table (PostgreSQL version)
-- This migration adds the missing payment_status_id column to the transactions table
-- Simplified for Render compatibility

-- Add payment_status_id column to transactions table (PostgreSQL)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_status_id INTEGER DEFAULT 1;

-- Garantir que os registros necessários existam na tabela payment_status
-- Esta etapa é repetida aqui para garantir que os dados estejam presentes
-- mesmo que a migração anterior tenha sido aplicada
INSERT INTO payment_status (id, name) VALUES (1, 'Em aberto') ON CONFLICT (id) DO NOTHING;
INSERT INTO payment_status (id, name) VALUES (2, 'Pago') ON CONFLICT (id) DO NOTHING;
INSERT INTO payment_status (id, name) VALUES (3, 'Vencido') ON CONFLICT (id) DO NOTHING;

-- Corrigir registros com payment_status_id = 3 que podem causar violação de chave estrangeira
-- Se não existir o registro id=3 na payment_status, atualizar para 1 (Em aberto)
UPDATE transactions SET payment_status_id = 1 
WHERE payment_status_id = 3 
AND NOT EXISTS (SELECT 1 FROM payment_status WHERE id = 3);

-- Atualizar registros antigos que possam ter payment_status_id NULL ou inválido
-- Esta atualização deve ocorrer ANTES de criar a constraint de foreign key
UPDATE transactions SET payment_status_id = CASE 
  WHEN is_paid = true THEN 2  -- Pago
  ELSE 1  -- Em aberto (padrão)
END WHERE payment_status_id IS NULL OR payment_status_id NOT IN (1, 2, 3);

-- Add foreign key constraint
-- Using plain ALTER TABLE ... ADD CONSTRAINT for Render compatibility
ALTER TABLE transactions ADD CONSTRAINT fk_transactions_payment_status 
  FOREIGN KEY (payment_status_id) REFERENCES payment_status(id);

-- Add index for better performance
-- Using CREATE INDEX for Render compatibility
CREATE INDEX IF NOT EXISTS idx_transactions_payment_status ON transactions(payment_status_id);