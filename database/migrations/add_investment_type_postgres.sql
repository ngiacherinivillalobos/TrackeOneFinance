-- Migration: Add investment type support to transactions table (PostgreSQL version)
-- This migration modifies the CHECK constraint to include 'investment' type
-- Note: Using 'type' column with English values to match SQLite structure

-- PostgreSQL supports ALTER TABLE to modify constraints directly
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_type_check,
ADD CONSTRAINT transactions_type_check 
CHECK (type IN ('expense', 'income', 'investment'));