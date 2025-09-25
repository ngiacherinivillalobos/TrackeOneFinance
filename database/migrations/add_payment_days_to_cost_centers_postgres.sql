-- Adicionar campo para dias de recebimento no centro de custo - PostgreSQL
-- Data: 09/09/2025
-- Using DO $$ blocks for Render compatibility

DO $$
BEGIN
  -- Adicionar coluna payment_days se não existir
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'cost_centers' AND column_name = 'payment_days') THEN
    ALTER TABLE cost_centers ADD COLUMN payment_days TEXT;
  END IF;
END $$;

-- Comentário: Este campo armazenará os dias de recebimento separados por vírgula
-- Exemplo: "5,15,20" para dias 5, 15 e 20 do mês