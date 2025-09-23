-- Corrige o tamanho da coluna card_number na tabela cards (SQLite)
-- Esta migração garante que a coluna card_number tenha tamanho suficiente para armazenar números de cartão

PRAGMA foreign_keys=off;

BEGIN TRANSACTION;

-- Criar nova tabela com o tamanho correto para card_number
CREATE TABLE cards_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'Crédito',
    limit_amount DECIMAL(10,2) DEFAULT 0,
    closing_day INTEGER DEFAULT 15,
    due_day INTEGER DEFAULT 10,
    bank_account_id INTEGER,
    card_number TEXT,
    expiry_date TEXT,
    brand TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id)
);

-- Copiar dados da tabela antiga para a nova
INSERT INTO cards_new SELECT * FROM cards;

-- Remover tabela antiga e renomear a nova
DROP TABLE cards;
ALTER TABLE cards_new RENAME TO cards;

-- Recriar índices se necessário
CREATE INDEX IF NOT EXISTS idx_cards_name ON cards(name);

COMMIT;

PRAGMA foreign_keys=on;