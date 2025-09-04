-- Migração para ajustar valores booleanos na tabela transactions (PostgreSQL)
-- Esta migração garante que os valores booleanos sejam tratados como 0 ou 1

-- Verificar se a tabela transactions existe e tem os campos necessários
-- Esta migração assume que os campos já existem e apenas ajusta os valores

-- Atualizar valores existentes nos campos booleanos para garantir consistência
UPDATE transactions SET is_installment = false WHERE is_installment IS NULL OR is_installment = '';
UPDATE transactions SET is_installment = true WHERE is_installment = 'true' OR is_installment = '1' OR is_installment = 1;

-- Para campos de recorrência (se existirem)
UPDATE transactions SET is_recurring = false WHERE is_recurring IS NULL OR is_recurring = '';
UPDATE transactions SET is_recurring = true WHERE is_recurring = 'true' OR is_recurring = '1' OR is_recurring = 1;

-- Se necessário, alterar o tipo das colunas para garantir consistência
-- ALTER TABLE transactions ALTER COLUMN is_installment TYPE BOOLEAN USING is_installment::BOOLEAN;
-- ALTER TABLE transactions ALTER COLUMN is_recurring TYPE BOOLEAN USING is_recurring::BOOLEAN;