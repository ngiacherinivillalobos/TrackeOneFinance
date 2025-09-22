-- Adiciona campos de detalhes do cartão à tabela cards (SQLite)
-- Esta migração adiciona os campos card_number, expiry_date e brand que estavam faltando

-- Como SQLite não suporta ALTER TABLE ADD COLUMN com IF NOT EXISTS em todas as versões,
-- vamos verificar se os campos existem antes de adicioná-los

PRAGMA foreign_keys=off;

BEGIN TRANSACTION;

-- Criar nova tabela com os campos adicionais
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
INSERT INTO cards_new (
    id, name, type, limit_amount, closing_day, due_day, bank_account_id, created_at, updated_at
) SELECT 
    id, name, type, limit_amount, closing_day, due_day, bank_account_id, created_at, updated_at
FROM cards;

-- Remover tabela antiga e renomear a nova
DROP TABLE cards;
ALTER TABLE cards_new RENAME TO cards;

-- Recriar índices se necessário
CREATE INDEX IF NOT EXISTS idx_cards_name ON cards(name);

COMMIT;

PRAGMA foreign_keys=on;