-- Add is_paid column to transactions table (PostgreSQL version)
-- Using DO $$ blocks for Render compatibility

DO $$
BEGIN
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'is_paid') THEN
    ALTER TABLE transactions ADD COLUMN is_paid BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Update existing rows based on payment_status_id
-- Assuming payment_status_id = 2 means 'Paid'
-- Using DO $$ blocks for Render compatibility
DO $$
BEGIN
  UPDATE transactions SET is_paid = TRUE WHERE payment_status_id = 2;
END $$;