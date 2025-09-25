-- Migration: Add payment_date column to transactions table (PostgreSQL)
-- This will allow storing the payment date directly in the transactions table for easier querying
-- Simplified for Render compatibility

-- Add payment_date column to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_date DATE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_payment_date ON transactions(payment_date);
