-- Migration: Add investment type support to transactions table
-- This migration modifies the CHECK constraint to include 'investment' type

-- SQLite doesn't support ALTER TABLE to modify constraints directly,
-- so we need to recreate the table

-- 1. Create a new table with the updated constraint
CREATE TABLE transactions_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer', 'investment')),
    category_id INTEGER,
    subcategory_id INTEGER,
    payment_status_id INTEGER,
    bank_account_id INTEGER,
    card_id INTEGER,
    contact_id INTEGER,
    transaction_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    cost_center_id INTEGER REFERENCES cost_centers(id),
    is_installment BOOLEAN DEFAULT 0,
    installment_number INTEGER DEFAULT NULL,
    total_installments INTEGER DEFAULT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id),
    FOREIGN KEY (payment_status_id) REFERENCES payment_status(id),
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id),
    FOREIGN KEY (card_id) REFERENCES cards(id),
    FOREIGN KEY (contact_id) REFERENCES contacts(id)
);

-- 2. Copy data from old table to new table
INSERT INTO transactions_new SELECT * FROM transactions;

-- 3. Drop the old table
DROP TABLE transactions;

-- 4. Rename the new table
ALTER TABLE transactions_new RENAME TO transactions;