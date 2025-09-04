-- Migração para adicionar campos de recorrência na tabela transactions (SQLite)
-- Execute este script para adicionar os novos campos de recorrência

-- SQLite não suporta ALTER TABLE para adicionar múltiplas colunas de uma vez,
-- então precisamos recriar a tabela

-- 1. Criar nova tabela com os campos de recorrência
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    cost_center_id INTEGER,
    
    -- Campos de parcelamento
    is_installment BOOLEAN DEFAULT 0,
    installment_number INTEGER DEFAULT NULL,
    total_installments INTEGER DEFAULT NULL,
    
    -- Campos de recorrência
    is_recurring BOOLEAN DEFAULT 0,
    recurrence_type TEXT CHECK (recurrence_type IN ('unica', 'mensal', 'fixo', 'personalizado')),
    recurrence_count INTEGER DEFAULT 1,
    recurrence_end_date DATE,
    
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id),
    FOREIGN KEY (payment_status_id) REFERENCES payment_status(id),
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id),
    FOREIGN KEY (card_id) REFERENCES cards(id),
    FOREIGN KEY (contact_id) REFERENCES contacts(id),
    FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id)
);

-- 2. Copiar dados da tabela antiga para a nova
INSERT INTO transactions_new (
    id, description, amount, type, category_id, subcategory_id,
    payment_status_id, bank_account_id, card_id, contact_id, transaction_date,
    created_at, cost_center_id, is_installment, installment_number, total_installments
)
SELECT 
    id, description, amount, type, category_id, subcategory_id,
    payment_status_id, bank_account_id, card_id, contact_id, transaction_date,
    created_at, cost_center_id, is_installment, installment_number, total_installments
FROM transactions;

-- 3. Remover a tabela antiga
DROP TABLE transactions;

-- 4. Renomear a nova tabela
ALTER TABLE transactions_new RENAME TO transactions;