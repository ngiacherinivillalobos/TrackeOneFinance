-- Migração robusta para garantir que cost_centers tenha payment_days - PostgreSQL
-- Data: 09/09/2025

-- Primeiro, garantir que a tabela cost_centers existe
CREATE TABLE IF NOT EXISTS cost_centers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    number TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Depois, adicionar a coluna payment_days se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'cost_centers' AND column_name = 'payment_days') THEN
        ALTER TABLE cost_centers ADD COLUMN payment_days TEXT;
        RAISE NOTICE 'Coluna payment_days adicionada à tabela cost_centers';
    ELSE
        RAISE NOTICE 'Coluna payment_days já existe na tabela cost_centers';
    END IF;
END $$;
