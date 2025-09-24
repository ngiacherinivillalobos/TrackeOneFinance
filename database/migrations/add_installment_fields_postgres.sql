-- Migração para adicionar campos de parcelamento na tabela transactions (PostgreSQL)
-- Execute este script para adicionar os novos campos de parcelamento

-- Adicionar campos de parcelamento à tabela transactions existente
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_installment BOOLEAN DEFAULT false;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS installment_number INTEGER DEFAULT NULL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS total_installments INTEGER DEFAULT NULL;
