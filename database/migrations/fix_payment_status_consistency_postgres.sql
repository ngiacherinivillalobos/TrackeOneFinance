-- Migration: Corrigir consistência de status de pagamento entre SQLite e PostgreSQL (PostgreSQL version)
-- Esta migração garante que o campo payment_status_id esteja presente e corretamente preenchido

-- Certificar-se de que os registros existem na tabela payment_status
INSERT INTO payment_status (id, name) VALUES 
(1, 'Em aberto'),
(2, 'Pago'),
(3, 'Vencido')
ON CONFLICT (id) DO NOTHING;

-- Atualizar registros antigos que possam ter payment_status_id NULL
UPDATE transactions SET payment_status_id = CASE 
  WHEN is_paid = true THEN 2  -- Pago
  ELSE 1  -- Em aberto (padrão)
END WHERE payment_status_id IS NULL;

-- Criar índice para melhorar performance nas consultas por status
CREATE INDEX IF NOT EXISTS idx_transactions_payment_status ON transactions(payment_status_id);