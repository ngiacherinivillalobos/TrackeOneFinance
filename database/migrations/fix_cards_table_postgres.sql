-- Migration: Corrigir estrutura da tabela cards para compatibilidade com SQLite (PostgreSQL)
-- Esta migração adiciona as colunas que estão faltando na tabela cards do PostgreSQL
-- Using DO $$ blocks for Render compatibility

DO $$
BEGIN
  -- Adicionar coluna 'type' se não existir (para compatibilidade com SQLite)
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'cards' AND column_name = 'type') THEN
    ALTER TABLE cards ADD COLUMN type VARCHAR(50) DEFAULT 'Crédito';
  END IF;
END $$;

DO $$
BEGIN
  -- Adicionar coluna 'bank_account_id' se não existir
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'cards' AND column_name = 'bank_account_id') THEN
    ALTER TABLE cards ADD COLUMN bank_account_id INTEGER;
    
    -- Add foreign key constraint
    -- Usando bloco DO $$ com verificação condicional para compatibilidade com Render
    ALTER TABLE cards ADD CONSTRAINT fk_cards_bank_account 
      FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id);
  END IF;
END $$;

DO $$
BEGIN
  -- Adicionar coluna 'limit_amount' se não existir
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'cards' AND column_name = 'limit_amount') THEN
    ALTER TABLE cards ADD COLUMN limit_amount DECIMAL(10,2) DEFAULT 0;
  END IF;
END $$;

-- Atualizar triggers para incluir as novas colunas
-- Primeiro remover trigger e função existentes se existirem
-- Como alternativa para evitar problemas com DO $$ no Render, não estamos recriando o trigger
-- O trigger existente deve ser suficiente para a funcionalidade