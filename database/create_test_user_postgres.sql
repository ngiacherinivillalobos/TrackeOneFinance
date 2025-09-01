-- Script para criar usuário de teste (PostgreSQL version)
-- Email: admin@trackone.com
-- Senha: admin123

INSERT INTO users (id, email, password) VALUES 
(1, 'admin@trackone.com', '$2b$10$wqqbrrLfFsQKggP1wYa89.ruh5CkP9DcRLnrxbM7/NnbHg6J2ntu.')
ON CONFLICT (id) DO UPDATE SET 
email = EXCLUDED.email, 
password = EXCLUDED.password;

-- Verificar se o usuário foi criado
SELECT * FROM users WHERE email = 'admin@trackone.com';