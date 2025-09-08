-- Migração para corrigir valores booleanos (PostgreSQL)
-- Comandos simples compatíveis com divisão por ponto-e-vírgula

-- Adicionar colunas se não existirem
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_installment BOOLEAN DEFAULT false

-- Adicionar is_recurring se não existir
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false

-- Adicionar is_paid se não existir
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false

-- Corrigir valores NULL para false
UPDATE transactions SET is_installment = false WHERE is_installment IS NULL

-- Corrigir is_recurring NULL
UPDATE transactions SET is_recurring = false WHERE is_recurring IS NULL

-- Corrigir is_paid NULL
UPDATE transactions SET is_paid = false WHERE is_paid IS NULL
