-- Add is_paid column to transactions table (PostgreSQL version)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'is_paid'
  ) THEN
    ALTER TABLE transactions ADD COLUMN is_paid BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Update existing rows based on payment_status_id
-- Assuming payment_status_id = 2 means 'Paid'
UPDATE transactions SET is_paid = TRUE WHERE payment_status_id = 2;