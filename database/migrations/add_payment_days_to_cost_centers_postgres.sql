-- Adicionar campo para dias de recebimento no centro de custo - PostgreSQL
-- Data: 09/09/2025

-- Adicionar coluna payment_days se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cost_centers' AND column_name = 'payment_days'
  ) THEN
    ALTER TABLE cost_centers ADD COLUMN payment_days TEXT;
  END IF;
END $$;

-- Comentário: Este campo armazenará os dias de recebimento separados por vírgula
-- Exemplo: "5,15,20" para dias 5, 15 e 20 do mês