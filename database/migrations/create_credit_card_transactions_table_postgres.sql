-- Migração para criar tabela específica para transações de cartão de crédito (PostgreSQL)
-- Esta tabela separa as transações de cartão de crédito das transações do controle mensal

-- Tabela de transações de cartão de crédito
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'credit_card_transactions'
  ) THEN
    CREATE TABLE credit_card_transactions (
        id SERIAL PRIMARY KEY,
        description TEXT NOT NULL,
        amount NUMERIC(10,2) NOT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'expense' CHECK (type IN ('expense', 'income', 'investment')),
        category_id INTEGER,
        subcategory_id INTEGER,
        card_id INTEGER NOT NULL,
        transaction_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Campos de parcelamento
        is_installment BOOLEAN DEFAULT FALSE,
        installment_number INTEGER,
        total_installments INTEGER,
        
        -- Campos de pagamento
        is_paid BOOLEAN DEFAULT FALSE,
        payment_date DATE,
        paid_amount NUMERIC(10,2),
        payment_type VARCHAR(50),
        payment_observations TEXT,
        discount NUMERIC(10,2) DEFAULT 0,
        interest NUMERIC(10,2) DEFAULT 0,
        
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (subcategory_id) REFERENCES subcategories(id),
        FOREIGN KEY (card_id) REFERENCES cards(id)
    );
  END IF;
END $$;

-- Índices para performance
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_credit_card_transactions_date'
  ) THEN
    CREATE INDEX idx_credit_card_transactions_date ON credit_card_transactions(transaction_date);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_credit_card_transactions_card'
  ) THEN
    CREATE INDEX idx_credit_card_transactions_card ON credit_card_transactions(card_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_credit_card_transactions_paid'
  ) THEN
    CREATE INDEX idx_credit_card_transactions_paid ON credit_card_transactions(is_paid);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_credit_card_transactions_installment'
  ) THEN
    CREATE INDEX idx_credit_card_transactions_installment ON credit_card_transactions(is_installment);
  END IF;
END $$;