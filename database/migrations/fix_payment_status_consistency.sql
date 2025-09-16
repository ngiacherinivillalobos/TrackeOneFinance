-- Migration: Corrigir consistência de status de pagamento entre SQLite e PostgreSQL
-- Esta migração garante que o campo payment_status_id esteja presente e corretamente preenchido

-- Para SQLite (desenvolvimento)
-- Adicionar coluna payment_status_id se não existir
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_status_id INTEGER DEFAULT 1;

-- Atualizar payment_status_id com base em is_paid para consistência
UPDATE transactions SET payment_status_id = CASE 
  WHEN is_paid = 1 OR is_paid = true THEN 2  -- Pago
  ELSE 1  -- Em aberto (padrão)
END WHERE payment_status_id IS NULL OR payment_status_id = 1;

-- Para PostgreSQL (produção)
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