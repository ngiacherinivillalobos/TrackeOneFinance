-- Schema completo para TrackOne Finance
-- Apenas estrutura das tabelas, sem dados de exemplo

-- 1. Tabela de tipos de categoria (para organizar categorias)
CREATE TABLE IF NOT EXISTS category_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category_type_id INTEGER,
    source_type TEXT DEFAULT 'todas' CHECK (source_type IN ('despesa', 'receita', 'investimento', 'todas')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_type_id) REFERENCES category_types(id)
);

-- 3. Tabela de subcategorias
CREATE TABLE IF NOT EXISTS subcategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS payment_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabela de contas bancárias
CREATE TABLE IF NOT EXISTS bank_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'Conta Corrente',
    agency TEXT,
    account_number TEXT,
    initial_balance DECIMAL(10,2) DEFAULT 0,
    current_balance DECIMAL(10,2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- 11. Tabela de usuários para autenticação
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- 6. Tabela de cartões de crédito
CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'Crédito',
    limit_amount DECIMAL(10,2) DEFAULT 0,
    closing_day INTEGER DEFAULT 15,
    due_day INTEGER DEFAULT 10,
    bank_account_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id)
);

-- 7. Tabela de contatos
CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    type TEXT DEFAULT 'Cliente',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabela de centros de custo
CREATE TABLE IF NOT EXISTS cost_centers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. Tabela de transações aprimorada
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('Despesa', 'Receita', 'Investimento')),
    category_id INTEGER,
    subcategory_id INTEGER,
    payment_status_id INTEGER,
    contact_id INTEGER,
    cost_center_id INTEGER,
    transaction_date DATE NOT NULL,
    
    -- Campos de recorrência
    is_recurring BOOLEAN DEFAULT 0,
    recurrence_type TEXT CHECK (recurrence_type IN ('unica', 'mensal', 'fixo', 'personalizado')),
    recurrence_count INTEGER DEFAULT 1, -- quantas vezes repetir
    recurrence_end_date DATE, -- data para finalizar (para fixo)
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id),
    FOREIGN KEY (payment_status_id) REFERENCES payment_status(id),
    FOREIGN KEY (contact_id) REFERENCES contacts(id),
    FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id)
);

-- 10. Tabela de detalhes de pagamento
CREATE TABLE IF NOT EXISTS payment_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    payment_date DATE NOT NULL,
    paid_amount DECIMAL(10,2) NOT NULL,
    original_amount DECIMAL(10,2) NOT NULL,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('bank_account', 'credit_card')),
    bank_account_id INTEGER,
    card_id INTEGER,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    interest_amount DECIMAL(10,2) DEFAULT 0,
    observations TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id),
    FOREIGN KEY (card_id) REFERENCES cards(id)
);

-- Inserindo apenas os tipos de categoria básicos para que o sistema funcione
INSERT OR IGNORE INTO category_types (name) VALUES 
('Despesa'),
('Receita'),
('Transferência'),
('Investimento');

-- Inserindo alguns status de pagamento básicos
INSERT OR IGNORE INTO payment_status (name) VALUES 
('Pago'),
('Pendente');
