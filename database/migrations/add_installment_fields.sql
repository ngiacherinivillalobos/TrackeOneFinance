-- Migração para adicionar campos de parcelamento na tabela transactions
-- Execute este script para adicionar os novos campos de parcelamento

-- Adicionar campos de parcelamento
ALTER TABLE transactions ADD COLUMN is_installment BOOLEAN DEFAULT 0;
ALTER TABLE transactions ADD COLUMN installment_number INTEGER DEFAULT NULL;
ALTER TABLE transactions ADD COLUMN total_installments INTEGER DEFAULT NULL;

-- Comentários dos campos:
-- is_installment: Indica se a transação é parcelada (0 = não, 1 = sim)
-- installment_number: Número da parcela atual (ex: 1, 2, 3, etc.)
-- total_installments: Total de parcelas (ex: 12 para parcelamento em 12x)

-- Exemplo de uso:
-- Para uma transação parcelada em 12x, a primeira parcela seria:
-- is_installment = 1, installment_number = 1, total_installments = 12

-- Para uma transação não parcelada:
-- is_installment = 0, installment_number = NULL, total_installments = NULL