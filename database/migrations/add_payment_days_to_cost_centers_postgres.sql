-- Adicionar campo para dias de recebimento no centro de custo - PostgreSQL
-- Data: 09/09/2025

-- Adicionar coluna payment_days se não existir
ALTER TABLE cost_centers 
ADD COLUMN IF NOT EXISTS payment_days TEXT;

-- Comentário: Este campo armazenará os dias de recebimento separados por vírgula
-- Exemplo: "5,15,20" para dias 5, 15 e 20 do mês
