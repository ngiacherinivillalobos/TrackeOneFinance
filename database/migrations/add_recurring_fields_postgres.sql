-- Migração para adicionar campos de recorrência na tabela transactions (PostgreSQL)
-- Execute este script para adicionar os novos campos de recorrência

-- Adicionar campos de recorrência à tabela transactions existente
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_type TEXT CHECK (recurrence_type IN ('unica', 'mensal', 'fixo', 'personalizado')),
ADD COLUMN IF NOT EXISTS recurrence_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;