-- Migration: Add payment_date column to transactions table
-- This will allow storing the payment date directly in the transactions table for easier querying

-- Add payment_date column to transactions table (SQLite) only if it doesn't exist
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_date DATE;

-- Add payment_date column to transactions table (PostgreSQL)
-- Note: This will be handled separately in the PostgreSQL migration