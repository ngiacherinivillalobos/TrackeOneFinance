-- Migration: Add cost_center_id to cash_flow table
-- This will allow cash flow records to be associated with cost centers

-- Since SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN,
-- we'll use a more compatible approach by creating a new table with the desired structure
-- and copying data over

-- Create a new table with the desired structure
CREATE TABLE cash_flow_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    record_type TEXT NOT NULL CHECK (record_type IN ('Despesa', 'Receita')),
    category_id INTEGER,
    subcategory_id INTEGER,
    cost_center_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id)
);

-- Copy data from the old table to the new table
INSERT INTO cash_flow_new (id, date, description, amount, record_type, category_id, subcategory_id, created_at, updated_at)
SELECT id, date, description, amount, record_type, category_id, subcategory_id, created_at, updated_at
FROM cash_flow;

-- Drop the old table
DROP TABLE cash_flow;

-- Rename the new table to the original name
ALTER TABLE cash_flow_new RENAME TO cash_flow;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_cash_flow_date ON cash_flow(date);
CREATE INDEX IF NOT EXISTS idx_cash_flow_record_type ON cash_flow(record_type);
CREATE INDEX IF NOT EXISTS idx_cash_flow_cost_center ON cash_flow(cost_center_id);