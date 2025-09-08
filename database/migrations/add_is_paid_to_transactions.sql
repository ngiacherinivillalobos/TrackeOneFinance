-- Add is_paid column to transactions table
ALTER TABLE transactions ADD COLUMN is_paid BOOLEAN DEFAULT 0;

-- Update existing rows based on payment_status_id
-- Assuming payment_status_id = 2 means 'Paid'
UPDATE transactions SET is_paid = 1 WHERE payment_status_id = 2;
