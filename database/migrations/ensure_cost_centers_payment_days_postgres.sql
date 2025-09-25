-- Migração robusta para garantir que cost_centers tenha payment_days - PostgreSQL
-- Data: 09/09/2025
-- Simplified for Render compatibility

-- Ensure cost_centers table exists
CREATE TABLE IF NOT EXISTS cost_centers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    number TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add payment_days column to cost_centers table if not exists
ALTER TABLE cost_centers ADD COLUMN IF NOT EXISTS payment_days TEXT;
