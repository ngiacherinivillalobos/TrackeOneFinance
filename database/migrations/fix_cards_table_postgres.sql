-- Migration: Corrigir estrutura da tabela cards para compatibilidade com SQLite (PostgreSQL)
-- Esta migração adiciona as colunas que estão faltando na tabela cards do PostgreSQL

-- Adicionar coluna 'type' se não existir (para compatibilidade com SQLite)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cards' AND column_name = 'type'
  ) THEN
    ALTER TABLE cards ADD COLUMN type VARCHAR(50) DEFAULT 'Crédito';
  END IF;
END $$;

-- Adicionar coluna 'bank_account_id' se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cards' AND column_name = 'bank_account_id'
  ) THEN
    ALTER TABLE cards ADD COLUMN bank_account_id INTEGER REFERENCES bank_accounts(id);
  END IF;
END $$;

-- Adicionar coluna 'limit_amount' se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cards' AND column_name = 'limit_amount'
  ) THEN
    ALTER TABLE cards ADD COLUMN limit_amount DECIMAL(10,2) DEFAULT 0;
  END IF;
END $$;

-- Atualizar triggers para incluir as novas colunas
-- Primeiro remover trigger e função existentes se existirem
-- Como alternativa para evitar problemas com DO $$ no Render, não estamos recriando o trigger
-- O trigger existente deve ser suficiente para a funcionalidade