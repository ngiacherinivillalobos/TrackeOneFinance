-- Migration: Corrigir registros com payment_status_id = 3 (PostgreSQL version)
-- Esta migração corrige registros com payment_status_id = 3 que causam violação de chave estrangeira
-- Simplified for Render compatibility

-- Garantir que os registros necessários existam na tabela payment_status
INSERT INTO payment_status (id, name) VALUES (1, 'Em aberto') ON CONFLICT (id) DO NOTHING;
INSERT INTO payment_status (id, name) VALUES (2, 'Pago') ON CONFLICT (id) DO NOTHING;
INSERT INTO payment_status (id, name) VALUES (3, 'Vencido') ON CONFLICT (id) DO NOTHING;

-- Corrigir registros com payment_status_id = 3 que podem causar violação de chave estrangeira
-- Se não existir o registro id=3 na payment_status, atualizar para 1 (Em aberto)
UPDATE transactions SET payment_status_id = 1 
WHERE payment_status_id = 3 
AND NOT EXISTS (SELECT 1 FROM payment_status WHERE id = 3);

-- Atualizar registros com payment_status_id = 3 para garantir que exista na payment_status
-- Esta verificação adicional garante que os dados estejam corretos
UPDATE transactions SET payment_status_id = 1 
WHERE payment_status_id = 3 
AND NOT EXISTS (SELECT 1 FROM payment_status WHERE id = 3);