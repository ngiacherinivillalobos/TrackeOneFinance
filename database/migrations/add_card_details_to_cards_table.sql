-- Adiciona campos de detalhes do cartão à tabela cards
-- Esta migração adiciona os campos card_number, expiry_date e brand que estavam faltando

ALTER TABLE cards ADD COLUMN IF NOT EXISTS card_number VARCHAR(4);
ALTER TABLE cards ADD COLUMN IF NOT EXISTS expiry_date VARCHAR(7);
ALTER TABLE cards ADD COLUMN IF NOT EXISTS brand VARCHAR(50);

-- Atualiza os triggers para incluir os novos campos
DROP TRIGGER IF EXISTS update_cards_updated_at ON cards;

CREATE OR REPLACE FUNCTION update_cards_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cards_updated_at 
BEFORE UPDATE ON cards 
FOR EACH ROW 
EXECUTE FUNCTION update_cards_updated_at_column();