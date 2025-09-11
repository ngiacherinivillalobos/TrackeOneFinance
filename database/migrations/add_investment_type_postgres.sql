-- Migration: Add investment type support to transactions table (PostgreSQL version)
-- This migration modifies the CHECK constraint to include 'investment' type

-- PostgreSQL supports ALTER TABLE to modify constraints directly
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_transaction_type_check,
ADD CONSTRAINT transactions_transaction_type_check 
CHECK (transaction_type IN ('income', 'expense', 'investment'));