-- Migração para ajustar valores booleanos na tabela transactions (PostgreSQL)
-- Esta migração garante que os valores booleanos sejam tratados corretamente

-- Primeiro, vamos verificar se as colunas existem antes de atualizá-las
DO $$
BEGIN
    -- Verificar e atualizar is_installment se a coluna existir
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'is_installment') THEN
        -- Atualizar valores NULL para false
        UPDATE transactions SET is_installment = false WHERE is_installment IS NULL;
        
        -- Se a coluna for text/varchar, converter para boolean
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'is_installment' AND data_type != 'boolean') THEN
            -- Alterar tipo da coluna para boolean
            ALTER TABLE transactions ALTER COLUMN is_installment TYPE BOOLEAN USING 
                CASE 
                    WHEN is_installment::TEXT IN ('true', '1', 't', 'yes', 'y') THEN true
                    ELSE false
                END;
        END IF;
    END IF;

    -- Verificar e atualizar is_recurring se a coluna existir
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'is_recurring') THEN
        -- Atualizar valores NULL para false
        UPDATE transactions SET is_recurring = false WHERE is_recurring IS NULL;
        
        -- Se a coluna for text/varchar, converter para boolean
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'is_recurring' AND data_type != 'boolean') THEN
            -- Alterar tipo da coluna para boolean
            ALTER TABLE transactions ALTER COLUMN is_recurring TYPE BOOLEAN USING 
                CASE 
                    WHEN is_recurring::TEXT IN ('true', '1', 't', 'yes', 'y') THEN true
                    ELSE false
                END;
        END IF;
    END IF;

    -- Verificar e atualizar is_paid se a coluna existir
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'is_paid') THEN
        -- Atualizar valores NULL para false
        UPDATE transactions SET is_paid = false WHERE is_paid IS NULL;
        
        -- Se a coluna for text/varchar, converter para boolean
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'is_paid' AND data_type != 'boolean') THEN
            -- Alterar tipo da coluna para boolean
            ALTER TABLE transactions ALTER COLUMN is_paid TYPE BOOLEAN USING 
                CASE 
                    WHEN is_paid::TEXT IN ('true', '1', 't', 'yes', 'y') THEN true
                    ELSE false
                END;
        END IF;
    END IF;
END
$$;