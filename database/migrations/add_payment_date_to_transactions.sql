-- Migration: Add payment_date column to transactions table
-- This will allow storing the payment date directly in the transactions table for easier querying

-- Add payment_date column to transactions table (SQLite)
ALTER TABLE transactions ADD COLUMN payment_date DATE;

-- Add payment_date column to transactions table (PostgreSQL)
-- Note: This will be handled separately in the PostgreSQL migration