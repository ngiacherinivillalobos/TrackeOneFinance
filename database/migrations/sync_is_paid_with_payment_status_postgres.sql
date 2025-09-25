-- Migration: Sync is_paid column with payment_status_id (PostgreSQL version)
-- This migration ensures that the is_paid column is properly synchronized with payment_status_id
-- Using DO $$ blocks for Render compatibility

-- Update existing rows based on payment_status_id
-- Assuming payment_status_id = 2 means 'Paid'
-- Using DO $$ blocks for Render compatibility
DO $$
BEGIN
  UPDATE transactions SET is_paid = TRUE WHERE payment_status_id = 2;
  UPDATE transactions SET is_paid = FALSE WHERE payment_status_id != 2;
END $$;