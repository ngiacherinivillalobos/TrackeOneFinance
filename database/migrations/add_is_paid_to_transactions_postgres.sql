-- Add is_paid column to transactions table (PostgreSQL version)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE;

-- Update existing rows based on payment_status_id
-- Assuming payment_status_id = 2 means 'Paid'
UPDATE transactions SET is_paid = TRUE WHERE payment_status_id = 2;