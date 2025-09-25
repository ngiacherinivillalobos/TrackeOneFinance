-- Migration: Corrigir consistência de status de pagamento entre SQLite e PostgreSQL (PostgreSQL version)
-- Esta migração garante que o campo payment_status_id esteja presente e corretamente preenchido
-- Using DO $$ blocks for Render compatibility

-- Inserir registros apenas se não existirem (por name E por id) - usando INSERT ... ON CONFLICT
-- Using DO $$ blocks for Render compatibility
DO $$
BEGIN
  INSERT INTO payment_status (id, name) VALUES (1, 'Em aberto') ON CONFLICT (id) DO NOTHING;
  INSERT INTO payment_status (id, name) VALUES (2, 'Pago') ON CONFLICT (id) DO NOTHING;
  INSERT INTO payment_status (id, name) VALUES (3, 'Vencido') ON CONFLICT (id) DO NOTHING;
END $$;

-- Atualizar registros antigos que possam ter payment_status_id NULL
-- Using DO $$ blocks for Render compatibility
DO $$
BEGIN
  UPDATE transactions SET payment_status_id = CASE 
    WHEN is_paid = true THEN 2  -- Pago
    ELSE 1  -- Em aberto (padrão)
  END WHERE payment_status_id IS NULL;
END $$;

-- Criar índice para melhorar performance nas consultas por status
-- Using DO $$ blocks for Render compatibility
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace 
                 WHERE c.relname = 'idx_transactions_payment_status' AND n.nspname = current_schema()) THEN
    CREATE INDEX idx_transactions_payment_status ON transactions(payment_status_id);
  END IF;
END $$;