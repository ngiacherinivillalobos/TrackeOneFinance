-- Migration: Corrigir registros com payment_status_id = 3 (PostgreSQL version)
-- Esta migração corrige registros com payment_status_id = 3 que causam violação de chave estrangeira
-- Simplified for Render compatibility

-- Garantir que os registros necessários existam na tabela payment_status
-- Tratando a constraint de unicidade no campo name
INSERT INTO payment_status (id, name) VALUES (1, 'Em aberto') ON CONFLICT (id) DO NOTHING;
INSERT INTO payment_status (id, name) VALUES (2, 'Pago') ON CONFLICT (id) DO NOTHING;
INSERT INTO payment_status (id, name) VALUES (3, 'Vencido') ON CONFLICT (id) DO NOTHING;

-- Em caso de constraint de unicidade no campo name, atualizar os registros existentes
INSERT INTO payment_status (id, name) VALUES (1, 'Em aberto') ON CONFLICT (name) DO UPDATE SET id = 1 WHERE payment_status.id = 1;
INSERT INTO payment_status (id, name) VALUES (2, 'Pago') ON CONFLICT (name) DO UPDATE SET id = 2 WHERE payment_status.id = 2;
INSERT INTO payment_status (id, name) VALUES (3, 'Vencido') ON CONFLICT (name) DO UPDATE SET id = 3 WHERE payment_status.id = 3;

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