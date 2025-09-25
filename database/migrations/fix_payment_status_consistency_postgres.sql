-- Migration: Corrigir consistência de status de pagamento entre SQLite e PostgreSQL (PostgreSQL version)
-- Esta migração garante que o campo payment_status_id esteja presente e corretamente preenchido
-- Simplified for Render compatibility

-- Inserir registros apenas se não existirem (por name E por id) - usando INSERT ... ON CONFLICT
INSERT INTO payment_status (id, name) VALUES (1, 'Em aberto') ON CONFLICT (id) DO NOTHING;
INSERT INTO payment_status (id, name) VALUES (2, 'Pago') ON CONFLICT (id) DO NOTHING;
INSERT INTO payment_status (id, name) VALUES (3, 'Vencido') ON CONFLICT (id) DO NOTHING;

-- Atualizar registros antigos que possam ter payment_status_id NULL
UPDATE transactions SET payment_status_id = CASE 
  WHEN is_paid = true THEN 2  -- Pago
  ELSE 1  -- Em aberto (padrão)
END WHERE payment_status_id IS NULL;

-- Verificar se há registros com payment_status_id = 3 e corrigir se necessário
-- Isso é importante para evitar violações de chave estrangeira
UPDATE transactions SET payment_status_id = 1 
WHERE payment_status_id = 3 
AND NOT EXISTS (SELECT 1 FROM payment_status WHERE id = 3);

-- Criar índice para melhorar performance nas consultas por status
CREATE INDEX IF NOT EXISTS idx_transactions_payment_status ON transactions(payment_status_id);