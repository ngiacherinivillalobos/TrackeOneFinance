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

-- 4. Tabela de status de pagamento
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
    account_number TEXT,
    initial_balance DECIMAL(10,2) DEFAULT 0,
    current_balance DECIMAL(10,2) DEFAULT 0,
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

-- 8. Tabela de transações
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    category_id INTEGER,
    subcategory_id INTEGER,
    payment_status_id INTEGER,
    bank_account_id INTEGER,
    card_id INTEGER,
    contact_id INTEGER,
    transaction_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id),
    FOREIGN KEY (payment_status_id) REFERENCES payment_status(id),
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id),
    FOREIGN KEY (card_id) REFERENCES cards(id),
    FOREIGN KEY (contact_id) REFERENCES contacts(id)
);

-- Inserindo alguns status de pagamento básicos
INSERT OR IGNORE INTO payment_status (id, name) VALUES 
(1, 'Em aberto'),
(2, 'Pago'),
(3, 'Vencido');

-- Tabelas criadas e prontas para uso
-- Todas as tabelas estão vazias para cadastro manual dos seus próprios dados
