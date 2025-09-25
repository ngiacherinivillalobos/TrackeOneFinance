-- Migração para adicionar campos de recorrência na tabela transactions (PostgreSQL)
-- Execute este script para adicionar os novos campos de recorrência
-- Simplified for Render compatibility

-- Add recurring fields to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recurrence_type TEXT CHECK (recurrence_type IN ('unica', 'mensal', 'fixo', 'personalizado'));
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recurrence_count INTEGER DEFAULT 1;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;
