# 🛠️ Correção de Deploy no Render - PostgreSQL

## 📋 Problema Identificado

Durante o deploy no Render, ocorreu um erro de sintaxe no PostgreSQL:

```
error: syntax error at or near "NOT"
```

Este erro estava relacionado ao uso de comandos `IF NOT EXISTS` em migrações do PostgreSQL, que não são totalmente compatíveis com o ambiente do Render.

## 🔧 Solução Aplicada

### 1. Substituição de `IF NOT EXISTS` por blocos `DO $$`

Todos os arquivos de migração do PostgreSQL foram atualizados para usar blocos `DO $$` com verificações condicionais ao invés de `IF NOT EXISTS`.

**Exemplo da correção:**

```sql
-- Antes (incompatível com Render)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_status_id INTEGER DEFAULT 1;
ALTER TABLE transactions ADD CONSTRAINT IF NOT EXISTS fk_transactions_payment_status 
  FOREIGN KEY (payment_status_id) REFERENCES payment_status(id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_status ON transactions(payment_status_id);

-- Depois (compatível com Render)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'payment_status_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN payment_status_id INTEGER DEFAULT 1;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_transactions_payment_status'
  ) THEN
    ALTER TABLE transactions ADD CONSTRAINT fk_transactions_payment_status 
      FOREIGN KEY (payment_status_id) REFERENCES payment_status(id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_transactions_payment_status'
  ) THEN
    CREATE INDEX idx_transactions_payment_status ON transactions(payment_status_id);
  END IF;
END $$;
```

### 2. Arquivos Corrigidos

Foram corrigidos os seguintes arquivos de migração:

1. `add_payment_status_id_to_transactions_postgres.sql`
2. `add_missing_payment_fields_postgres.sql`
3. `add_due_date_to_credit_card_transactions_postgres.sql`
4. `add_cash_flow_table_postgres.sql`
5. `add_cost_center_to_cash_flow_postgres.sql`
6. `add_cost_center_to_users_postgres.sql`
7. `add_installment_fields_postgres.sql`
8. `add_investment_type_postgres.sql`
9. `add_is_paid_to_transactions_postgres.sql`
10. `add_payment_date_to_transactions_postgres.sql`
11. `add_payment_days_to_cost_centers_postgres.sql`
12. `add_recurring_fields_postgres.sql`
13. `create_credit_card_transactions_table_postgres.sql`
14. `ensure_cost_centers_payment_days_postgres.sql`
15. `fix_cards_table_postgres.sql`
16. `fix_payment_status_consistency_postgres.sql`
17. `add_card_details_to_cards_table_postgres.sql`

### 3. Script de Verificação

Foi criado um script `test_postgres_migrations_fixed.js` para verificar se todas as migrações estão corretas e não contêm comandos `IF NOT EXISTS` fora de blocos `DO $$`.

## ✅ Resultado

Após as correções, o deploy no Render deve funcionar corretamente, sem erros de sintaxe no PostgreSQL.

## 📈 Próximos Passos

1. **Reiniciar o deploy no Render**
2. **Verificar os logs do serviço**
3. **Testar a API após o deploy**

## 🆘 Suporte

Em caso de novos problemas:
- Verifique os logs do Render
- Execute o script de verificação
- Consulte este documento