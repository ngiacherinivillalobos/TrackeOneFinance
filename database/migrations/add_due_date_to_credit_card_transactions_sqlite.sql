-- Adiciona campo due_date à tabela credit_card_transactions (SQLite)
-- Esta migração adiciona o campo due_date para armazenar a data de vencimento calculada

PRAGMA foreign_keys=off;

BEGIN TRANSACTION;

-- Criar nova tabela com o campo due_date adicionado
CREATE TABLE credit_card_transactions_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    type TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('expense', 'income', 'investment')),
    category_id INTEGER,
    subcategory_id INTEGER,
    card_id INTEGER NOT NULL,
    transaction_date DATE NOT NULL,
    due_date DATE,  -- Nova coluna para data de vencimento
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

-- Copiar dados da tabela antiga para a nova, mantendo due_date como NULL por enquanto
INSERT INTO credit_card_transactions_new (
    id, description, amount, type, category_id, subcategory_id, card_id, 
    transaction_date, due_date, created_at, updated_at, is_installment, 
    installment_number, total_installments, is_paid, payment_date, 
    paid_amount, payment_type, payment_observations, discount, interest
) SELECT 
    id, description, amount, type, category_id, subcategory_id, card_id, 
    transaction_date, NULL as due_date, created_at, updated_at, is_installment, 
    installment_number, total_installments, is_paid, payment_date, 
    paid_amount, payment_type, payment_observations, discount, interest
FROM credit_card_transactions;

-- Remover tabela antiga e renomear a nova
DROP TABLE credit_card_transactions;
ALTER TABLE credit_card_transactions_new RENAME TO credit_card_transactions;

-- Recriar índices
CREATE INDEX IF NOT EXISTS idx_credit_card_transactions_date ON credit_card_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_credit_card_transactions_due_date ON credit_card_transactions(due_date);
CREATE INDEX IF NOT EXISTS idx_credit_card_transactions_card ON credit_card_transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_credit_card_transactions_paid ON credit_card_transactions(is_paid);
CREATE INDEX IF NOT EXISTS idx_credit_card_transactions_installment ON credit_card_transactions(is_installment);

COMMIT;

PRAGMA foreign_keys=on;