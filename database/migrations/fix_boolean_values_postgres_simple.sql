-- Migração simples para corrigir valores booleanos (PostgreSQL)
-- Esta versão é mais conservadora e segura

-- Apenas garantir que campos booleanos existentes tenham valores corretos
-- Usar UPDATE direto com COALESCE para garantir valores não-nulos

-- Corrigir is_installment (usar valores padrão para campos nulos)
UPDATE transactions 
SET is_installment = COALESCE(is_installment, false) 
WHERE is_installment IS NULL;

-- Corrigir is_recurring (usar valores padrão para campos nulos)
UPDATE transactions 
SET is_recurring = COALESCE(is_recurring, false) 
WHERE is_recurring IS NULL;

-- Corrigir is_paid baseado no payment_status_id
UPDATE transactions 
SET is_paid = CASE 
    WHEN payment_status_id = 2 THEN true 
    ELSE false 
END
WHERE is_paid IS NULL OR payment_status_id IS NOT NULL;
