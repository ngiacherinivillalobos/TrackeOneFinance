-- CORREÇÃO IMEDIATA: Fix Card Number Length
-- Execute este comando diretamente no console do PostgreSQL do Render

-- 1. Verificar estrutura atual
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'cards' AND column_name = 'card_number';

-- 2. Aplicar correção
ALTER TABLE cards ALTER COLUMN card_number TYPE VARCHAR(20);

-- 3. Verificar se foi aplicada
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'cards' AND column_name = 'card_number';

-- RESULTADO ESPERADO: character_maximum_length = 20