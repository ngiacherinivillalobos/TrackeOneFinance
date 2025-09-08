-- Migration: Adicionar campo balance à tabela bank_accounts (SQLite)
-- Data: 2025-09-08

-- Adicionar coluna balance se não existir (SQLite)
ALTER TABLE bank_accounts ADD COLUMN balance DECIMAL(10,2) DEFAULT 0;

-- Atualizar contas existentes com saldo inicial 0
UPDATE bank_accounts SET balance = 0 WHERE balance IS NULL;
