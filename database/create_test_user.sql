-- Script para criar usuário de teste
-- Email: admin@trackone.com
-- Senha: admin123

INSERT OR REPLACE INTO users (email, password) VALUES 
('admin@trackone.com', '$2b$10$wqqbrrLfFsQKggP1wYa89.ruh5CkP9DcRLnrxbM7/NnbHg6J2ntu.');

-- Verificar se o usuário foi criado
SELECT * FROM users WHERE email = 'admin@trackone.com';