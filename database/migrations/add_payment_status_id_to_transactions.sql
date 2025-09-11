-- Migration: Add payment_status_id column to transactions table
-- This migration adds the missing payment_status_id column to the transactions table

-- Add payment_status_id column to transactions table
ALTER TABLE transactions ADD COLUMN payment_status_id INTEGER DEFAULT 1;

-- Note: SQLite doesn't support adding foreign key constraints to existing tables
-- The foreign key relationship will be handled in the application code