-- Migração para criar tabela específica para transações de cartão de crédito (SQLite)
-- Esta tabela separa as transações de cartão de crédito das transações do controle mensal

-- Tabela de transações de cartão de crédito
CREATE TABLE IF NOT EXISTS credit_card_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    type TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('expense', 'income', 'investment')),
    category_id INTEGER,
    subcategory_id INTEGER,
    card_id INTEGER NOT NULL,
    transaction_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Campos de parcelamento
    is_installment BOOLEAN DEFAULT 0,
    installment_number INTEGER DEFAULT NULL,
    total_installments INTEGER DEFAULT NULL,
    
    -- Campos de pagamento
    is_paid BOOLEAN DEFAULT 0,
    payment_date DATE,
    paid_amount DECIMAL(10,2),
    payment_type TEXT,
    payment_observations TEXT,
    discount DECIMAL(10,2) DEFAULT 0,
    interest DECIMAL(10,2) DEFAULT 0,
    
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id),
    FOREIGN KEY (card_id) REFERENCES cards(id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_credit_card_transactions_date ON credit_card_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_credit_card_transactions_card ON credit_card_transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_credit_card_transactions_paid ON credit_card_transactions(is_paid);
CREATE INDEX IF NOT EXISTS idx_credit_card_transactions_installment ON credit_card_transactions(is_installment);