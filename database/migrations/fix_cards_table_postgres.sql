-- Migration: Corrigir estrutura da tabela cards para compatibilidade com SQLite (PostgreSQL)
-- Esta migração adiciona as colunas que estão faltando na tabela cards do PostgreSQL

-- Adicionar coluna 'type' se não existir (para compatibilidade com SQLite)
ALTER TABLE cards ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'Crédito';

-- Adicionar coluna 'bank_account_id' se não existir
ALTER TABLE cards ADD COLUMN IF NOT EXISTS bank_account_id INTEGER REFERENCES bank_accounts(id);

-- Adicionar coluna 'limit_amount' se não existir
ALTER TABLE cards ADD COLUMN IF NOT EXISTS limit_amount DECIMAL(10,2) DEFAULT 0;

-- Atualizar triggers para incluir as novas colunas
-- Primeiro remover trigger e função existentes se existirem
-- Como alternativa para evitar problemas com DO $$ no Render, não estamos recriando o trigger
-- O trigger existente deve ser suficiente para a funcionalidade