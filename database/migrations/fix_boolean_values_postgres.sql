-- Migração simples para corrigir valores booleanos (PostgreSQL)
-- Esta versão usa comandos SQL diretos sem blocos procedurais

-- Garantir que campos booleanos tenham valores corretos
-- Usar comandos simples e diretos

-- Primeiro, adicionar colunas se não existirem (com IF NOT EXISTS)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_installment BOOLEAN DEFAULT false;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;

-- Corrigir valores NULL para false em campos booleanos
UPDATE transactions SET is_installment = false WHERE is_installment IS NULL;
UPDATE transactions SET is_recurring = false WHERE is_recurring IS NULL;
UPDATE transactions SET is_paid = false WHERE is_paid IS NULL;
