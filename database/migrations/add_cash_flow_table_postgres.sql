-- Migration: Add cash_flow table for daily cash flow records (PostgreSQL version)
-- This table will store simple daily cash flow entries

CREATE TABLE IF NOT EXISTS cash_flow (
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

-- Create index for better performance on date queries
CREATE INDEX IF NOT EXISTS idx_cash_flow_date ON cash_flow(date);
CREATE INDEX IF NOT EXISTS idx_cash_flow_record_type ON cash_flow(record_type);