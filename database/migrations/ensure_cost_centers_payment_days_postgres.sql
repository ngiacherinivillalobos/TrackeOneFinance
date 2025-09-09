-- Migração robusta para garantir que cost_centers tenha payment_days - PostgreSQL
-- Data: 09/09/2025

-- Primeiro, garantir que a tabela cost_centers existe
CREATE TABLE IF NOT EXISTS cost_centers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    number TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Depois, adicionar a coluna payment_days se não existir (sintaxe simplificada)
ALTER TABLE cost_centers 
ADD COLUMN IF NOT EXISTS payment_days TEXT;
