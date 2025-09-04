-- Migração para ajustar valores booleanos na tabela transactions (SQLite)
-- Esta migração garante que os valores booleanos sejam tratados como 0 ou 1

-- Verificar se a tabela transactions existe e tem os campos necessários
-- Esta migração assume que os campos já existem e apenas ajusta os valores

-- Atualizar valores existentes nos campos booleanos para garantir consistência
UPDATE transactions SET is_installment = 0 WHERE is_installment IS NULL OR is_installment = '' OR is_installment = 'false';
UPDATE transactions SET is_installment = 1 WHERE is_installment = 'true' OR is_installment = '1';

-- Para campos de recorrência (se existirem)
UPDATE transactions SET is_recurring = 0 WHERE is_recurring IS NULL OR is_recurring = '' OR is_recurring = 'false';
UPDATE transactions SET is_recurring = 1 WHERE is_recurring = 'true' OR is_recurring = '1';

-- Verificar se os campos de recorrência existem antes de tentar atualizá-los
-- Se não existirem, eles serão adicionados pela migração add_recurring_fields_sqlite.sql (a ser criada)