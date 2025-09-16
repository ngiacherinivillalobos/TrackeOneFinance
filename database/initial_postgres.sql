-- Schema completo para TrackOne Finance - Versão PostgreSQL
-- Apenas estrutura das tabelas, sem dados de exemplo

-- 1. Tabela de tipos de categoria (para organizar categorias)
CREATE TABLE IF NOT EXISTS category_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category_type_id INTEGER,
    source_type TEXT DEFAULT 'todas' CHECK (source_type IN ('despesa', 'receita', 'investimento', 'todas')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_type_id) REFERENCES category_types(id)
);

-- 3. Tabela de subcategorias
CREATE TABLE IF NOT EXISTS subcategories (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 4. Tabela de status de pagamento
CREATE TABLE IF NOT EXISTS payment_status (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabela de contas bancárias
CREATE TABLE IF NOT EXISTS bank_accounts (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'Conta Corrente',
    agency TEXT,
    account_number TEXT,
    initial_balance NUMERIC(10,2) DEFAULT 0,
    current_balance NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Tabela de usuários para autenticação
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabela de cartões de crédito
CREATE TABLE IF NOT EXISTS cards (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'Crédito',
    limit_amount NUMERIC(10,2) DEFAULT 0,
    closing_day INTEGER DEFAULT 15,
    due_day INTEGER DEFAULT 10,
    bank_account_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id)
);

-- 7. Tabela de contatos
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    type TEXT DEFAULT 'Cliente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabela de centros de custo
CREATE TABLE IF NOT EXISTS cost_centers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    number TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Tabela de transações aprimorada
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'investment')),
    category_id INTEGER,
    subcategory_id INTEGER,
    payment_status_id INTEGER,
    bank_account_id INTEGER,
    card_id INTEGER,
    contact_id INTEGER,
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cost_center_id INTEGER,
    
    -- Campos de parcelamento
    is_installment BOOLEAN DEFAULT false,
    installment_number INTEGER DEFAULT NULL,
    total_installments INTEGER DEFAULT NULL,
    
    -- Campos de recorrência
    is_recurring BOOLEAN DEFAULT false,
    recurrence_type TEXT CHECK (recurrence_type IN ('unica', 'mensal', 'fixo', 'personalizado')),
    recurrence_count INTEGER DEFAULT 1, -- quantas vezes repetir
    recurrence_end_date DATE, -- data para finalizar (para fixo)
    
    -- Campos de pagamento (compatíveis com SQLite)
    is_paid BOOLEAN DEFAULT FALSE,
    payment_date DATE,
    paid_amount NUMERIC(10,2),
    payment_type TEXT,
    payment_observations TEXT,
    discount NUMERIC(10,2) DEFAULT 0,
    interest NUMERIC(10,2) DEFAULT 0,
    
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id),
    FOREIGN KEY (payment_status_id) REFERENCES payment_status(id),
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id),
    FOREIGN KEY (card_id) REFERENCES cards(id),
    FOREIGN KEY (contact_id) REFERENCES contacts(id),
    FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id)
);

-- 10. Tabela de detalhes de pagamento
CREATE TABLE IF NOT EXISTS payment_details (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER NOT NULL,
    payment_date DATE NOT NULL,
    paid_amount NUMERIC(10,2) NOT NULL,
    original_amount NUMERIC(10,2) NOT NULL,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('bank_account', 'credit_card')),
    bank_account_id INTEGER,
    card_id INTEGER,
    discount_amount NUMERIC(10,2) DEFAULT 0,
    interest_amount NUMERIC(10,2) DEFAULT 0,
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id),
    FOREIGN KEY (card_id) REFERENCES cards(id)
);

-- 12. Tabela de fluxo de caixa
CREATE TABLE IF NOT EXISTS cash_flow (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    record_type TEXT NOT NULL CHECK (record_type IN ('Despesa', 'Receita')),
    category_id INTEGER,
    subcategory_id INTEGER,
    cost_center_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id),
    FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cash_flow_date ON cash_flow(date);
CREATE INDEX IF NOT EXISTS idx_cash_flow_record_type ON cash_flow(record_type);
CREATE INDEX IF NOT EXISTS idx_cash_flow_cost_center ON cash_flow(cost_center_id);

-- Inserindo apenas os tipos de categoria básicos para que o sistema funcione
INSERT INTO category_types (id, name) VALUES 
(1, 'Despesa'),
(2, 'Receita'),
(3, 'Transferência'),
(4, 'Investimento')
ON CONFLICT (id) DO NOTHING;

-- Inserindo alguns status de pagamento básicos
-- Verificar se os registros já existem antes de inserir
INSERT INTO payment_status (id, name) 
SELECT 1, 'Em aberto'
WHERE NOT EXISTS (SELECT 1 FROM payment_status WHERE name = 'Em aberto' OR id = 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO payment_status (id, name) 
SELECT 2, 'Pago'
WHERE NOT EXISTS (SELECT 1 FROM payment_status WHERE name = 'Pago' OR id = 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO payment_status (id, name) 
SELECT 3, 'Vencido'
WHERE NOT EXISTS (SELECT 1 FROM payment_status WHERE name = 'Vencido' OR id = 3)
ON CONFLICT (id) DO NOTHING;
