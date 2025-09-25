-- Migration: Add cash_flow table for daily cash flow records (PostgreSQL version)
-- This table will store simple daily cash flow entries
-- Using DO $$ blocks for Render compatibility

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cash_flow') THEN
    CREATE TABLE cash_flow (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        description TEXT NOT NULL,
        amount NUMERIC(10,2) NOT NULL,
        record_type TEXT NOT NULL CHECK (record_type IN ('Despesa', 'Receita')),
        category_id INTEGER,
        subcategory_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Add foreign key constraints
    -- Usando blocos DO $$ com verificação condicional para compatibilidade com Render
    ALTER TABLE cash_flow ADD CONSTRAINT fk_cash_flow_category 
      FOREIGN KEY (category_id) REFERENCES categories(id);
    ALTER TABLE cash_flow ADD CONSTRAINT fk_cash_flow_subcategory 
      FOREIGN KEY (subcategory_id) REFERENCES subcategories(id);
  END IF;
END $$;

-- Create indexes for better performance on date queries
-- Using DO $$ blocks for Render compatibility
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace 
                 WHERE c.relname = 'idx_cash_flow_date' AND n.nspname = current_schema()) THEN
    CREATE INDEX idx_cash_flow_date ON cash_flow(date);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace 
                 WHERE c.relname = 'idx_cash_flow_record_type' AND n.nspname = current_schema()) THEN
    CREATE INDEX idx_cash_flow_record_type ON cash_flow(record_type);
  END IF;
END $$;