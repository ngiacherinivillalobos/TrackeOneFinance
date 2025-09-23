-- Corrige o tamanho da coluna card_number na tabela cards (PostgreSQL)
-- Esta migração garante que a coluna card_number tenha tamanho suficiente para armazenar números de cartão

ALTER TABLE cards ALTER COLUMN card_number TYPE VARCHAR(20);