-- Migration: Corrigir consistência de status de pagamento entre SQLite e PostgreSQL (PostgreSQL version)
-- Esta migração garante que o campo payment_status_id esteja presente e corretamente preenchido

-- Usar DO block para inserir registros de forma mais robusta evitando conflitos
DO $$ 
BEGIN
  -- Inserir registros apenas se não existirem (por name E por id)
  IF NOT EXISTS(SELECT 1 FROM payment_status WHERE id = 1 OR name = 'Em aberto') THEN
    INSERT INTO payment_status (id, name) VALUES (1, 'Em aberto');
  END IF;
  
  IF NOT EXISTS(SELECT 1 FROM payment_status WHERE id = 2 OR name = 'Pago') THEN
    INSERT INTO payment_status (id, name) VALUES (2, 'Pago');
  END IF;
  
  IF NOT EXISTS(SELECT 1 FROM payment_status WHERE id = 3 OR name = 'Vencido') THEN
    INSERT INTO payment_status (id, name) VALUES (3, 'Vencido');
  END IF;
END $$;

-- Atualizar registros antigos que possam ter payment_status_id NULL
UPDATE transactions SET payment_status_id = CASE 
  WHEN is_paid = true THEN 2  -- Pago
  ELSE 1  -- Em aberto (padrão)
END WHERE payment_status_id IS NULL;

-- Criar índice para melhorar performance nas consultas por status
CREATE INDEX IF NOT EXISTS idx_transactions_payment_status ON transactions(payment_status_id);