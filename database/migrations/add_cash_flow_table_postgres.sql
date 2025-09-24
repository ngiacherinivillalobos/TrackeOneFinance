-- Migration: Add cash_flow table for daily cash flow records (PostgreSQL version)
-- This table will store simple daily cash flow entries

-- Create table only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'cash_flow'
  ) THEN
    CREATE TABLE cash_flow (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        description TEXT NOT NULL,
        amount NUMERIC(10,2) NOT NULL,
        record_type TEXT NOT NULL CHECK (record_type IN ('Despesa', 'Receita')),
        category_id INTEGER,
        subcategory_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (subcategory_id) REFERENCES subcategories(id)
    );
  END IF;
END $$;

-- Create index for better performance on date queries
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_cash_flow_date'
  ) THEN
    CREATE INDEX idx_cash_flow_date ON cash_flow(date);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_cash_flow_record_type'
  ) THEN
    CREATE INDEX idx_cash_flow_record_type ON cash_flow(record_type);
  END IF;
END $$;