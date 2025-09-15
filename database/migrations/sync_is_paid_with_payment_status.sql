-- Migration: Sync is_paid column with payment_status_id
-- This migration ensures that the is_paid column is properly synchronized with payment_status_id

-- Update existing rows based on payment_status_id
-- Assuming payment_status_id = 2 means 'Paid'
UPDATE transactions SET is_paid = 1 WHERE payment_status_id = 2;
UPDATE transactions SET is_paid = 0 WHERE payment_status_id != 2;
