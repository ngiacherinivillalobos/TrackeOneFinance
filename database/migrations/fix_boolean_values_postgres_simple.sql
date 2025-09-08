-- Migração simples para corrigir valores booleanos (PostgreSQL)
-- Esta versão é mais conservadora e segura

-- Apenas garantir que campos booleanos existentes tenham valores corretos
-- Não tenta comparar com strings vazias

-- Corrigir is_installment se existir
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'is_installment') THEN
        UPDATE transactions SET is_installment = COALESCE(is_installment, false);
    END IF;
END
$$;

-- Corrigir is_recurring se existir  
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'is_recurring') THEN
        UPDATE transactions SET is_recurring = COALESCE(is_recurring, false);
    END IF;
END
$$;

-- Corrigir is_paid se existir
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'is_paid') THEN
        UPDATE transactions SET is_paid = COALESCE(is_paid, false);
    END IF;
END
$$;
