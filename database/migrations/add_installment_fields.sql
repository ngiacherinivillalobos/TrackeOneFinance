-- Migração para adicionar campos de parcelamento na tabela transactions
-- Execute este script para adicionar os novos campos de parcelamento

-- Garantir que não exista nenhuma tabela temporária
DROP TABLE IF EXISTS transactions_new;

-- Criar nova tabela com os campos de parcelamento
CREATE TABLE transactions_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'investment')),
    category_id INTEGER,
    subcategory_id INTEGER,
    payment_status_id INTEGER,
    bank_account_id INTEGER,
    card_id INTEGER,
    contact_id INTEGER,
    transaction_date DATE NOT NULL,
    created_at DATETIME,
    cost_center_id INTEGER,
    
    -- Campos de parcelamento
    is_installment BOOLEAN DEFAULT 0,
    installment_number INTEGER DEFAULT NULL,
    total_installments INTEGER DEFAULT NULL,
    
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id),
    FOREIGN KEY (payment_status_id) REFERENCES payment_status(id),
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id),
    FOREIGN KEY (card_id) REFERENCES cards(id),
    FOREIGN KEY (contact_id) REFERENCES contacts(id),
    FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id)
);

-- Copiar dados da tabela antiga para a nova
INSERT INTO transactions_new (
    id, description, amount, type, category_id, subcategory_id, 
    payment_status_id, bank_account_id, card_id, contact_id, transaction_date, 
    created_at, cost_center_id
)
SELECT 
    id, description, amount, type, category_id, subcategory_id, 
    payment_status_id, bank_account_id, card_id, contact_id, transaction_date, 
    created_at, cost_center_id
FROM transactions;

-- Remover a tabela antiga
DROP TABLE transactions;

-- Renomear a nova tabela
ALTER TABLE transactions_new RENAME TO transactions;