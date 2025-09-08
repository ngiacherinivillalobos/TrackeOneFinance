-- Adicionar campo para dias de recebimento no centro de custo
-- Data: 08/09/2025

ALTER TABLE cost_centers ADD COLUMN payment_days TEXT;

-- Comentário: Este campo armazenará os dias de recebimento separados por vírgula
-- Exemplo: "5,15,20" para dias 5, 15 e 20 do mês
