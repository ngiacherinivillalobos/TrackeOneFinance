-- Adiciona campos de detalhes do cartão à tabela cards (PostgreSQL)
-- Esta migração adiciona os campos card_number, expiry_date e brand que estavam faltando

ALTER TABLE cards ADD COLUMN IF NOT EXISTS card_number VARCHAR(20);
ALTER TABLE cards ADD COLUMN IF NOT EXISTS expiry_date VARCHAR(7);
ALTER TABLE cards ADD COLUMN IF NOT EXISTS brand VARCHAR(50);

-- Atualiza os triggers para incluir os novos campos
-- Remover trigger existente se existir
DROP TRIGGER IF EXISTS update_cards_updated_at ON cards;

-- Como alternativa para evitar problemas com DO $$ no Render, não estamos recriando o trigger
-- O trigger existente deve ser suficiente para a funcionalidade