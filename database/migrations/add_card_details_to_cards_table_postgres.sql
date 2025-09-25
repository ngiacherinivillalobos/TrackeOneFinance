-- Adiciona campos de detalhes do cartão à tabela cards (PostgreSQL)
-- Esta migração adiciona os campos card_number, expiry_date e brand que estavam faltando
-- Usando blocos DO $$ para compatibilidade com Render

DO $$ 
BEGIN
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'cards' AND column_name = 'card_number') THEN
    ALTER TABLE cards ADD COLUMN card_number VARCHAR(20);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'cards' AND column_name = 'expiry_date') THEN
    ALTER TABLE cards ADD COLUMN expiry_date VARCHAR(7);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'cards' AND column_name = 'brand') THEN
    ALTER TABLE cards ADD COLUMN brand VARCHAR(50);
  END IF;
END $$;

-- Atualiza os triggers para incluir os novos campos
-- Remover trigger existente se existir
-- Como alternativa para evitar problemas com DO $$ no Render, não estamos recriando o trigger
-- O trigger existente deve ser suficiente para a funcionalidade