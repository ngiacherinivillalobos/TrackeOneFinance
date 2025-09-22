-- Migração para criar tabela específica para transações de cartão de crédito
-- Esta tabela separa as transações de cartão de crédito das transações do controle mensal

-- Criação da tabela de transações de cartão de crédito
-- Esta tabela armazena as transações específicas de cartões de crédito

CREATE TABLE IF NOT EXISTS credit_card_transactions (
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    total_installments INTEGER NOT NULL,
    installment_number INTEGER DEFAULT 1,
    card_id INTEGER NOT NULL,
    category_id INTEGER,
    subcategory_id INTEGER,
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Chaves estrangeiras
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_credit_card_transactions_date ON credit_card_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_credit_card_transactions_card ON credit_card_transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_credit_card_transactions_paid ON credit_card_transactions(is_paid);
CREATE INDEX IF NOT EXISTS idx_credit_card_transactions_installment ON credit_card_transactions(is_installment);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_credit_card_transactions_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_credit_card_transactions_updated_at 
BEFORE UPDATE ON credit_card_transactions 
FOR EACH ROW 
EXECUTE FUNCTION update_credit_card_transactions_updated_at_column();