# 🛠️ Troubleshooting Completo do Deploy - TrackeOne Finance

## 📋 Sumário de Problemas Identificados

1. **Inconsistência no schema do banco de dados PostgreSQL**
   - Falta do campo `payment_status_id` na tabela `transactions` no arquivo [001_init_postgresql.sql](file:///Users/nataligiacherini/Development/TrackeOneFinance/database/migrations/001_init_postgresql.sql)
   - O campo existe no arquivo [init_render_postgresql.sql](file:///Users/nataligiacherini/Development/TrackeOneFinance/database/init_render_postgresql.sql) mas não na migração

2. **Inconsistência nas migrações**
   - Falta de migrações correspondentes entre SQLite e PostgreSQL para alguns recursos

## 🔧 Soluções Implementadas

### 1. Adição de migrações para o campo `payment_status_id`

Foram criadas duas migrações para garantir a consistência entre os ambientes:

**Para PostgreSQL:**
```sql
-- database/migrations/add_payment_status_id_to_transactions_postgres.sql
-- Migration: Add payment_status_id column to transactions table (PostgreSQL version)

DO $$ 
BEGIN
  IF NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='transactions' AND column_name='payment_status_id') THEN
    ALTER TABLE transactions ADD COLUMN payment_status_id INTEGER DEFAULT 1;
    ALTER TABLE transactions ADD CONSTRAINT fk_transactions_payment_status 
      FOREIGN KEY (payment_status_id) REFERENCES payment_status(id);
    CREATE INDEX IF NOT EXISTS idx_transactions_payment_status ON transactions(payment_status_id);
  END IF;
END $$;
```

**Para SQLite:**
```sql
-- database/migrations/add_payment_status_id_to_transactions.sql
-- Migration: Add payment_status_id column to transactions table

ALTER TABLE transactions ADD COLUMN payment_status_id INTEGER DEFAULT 1;
```

### 2. Scripts de verificação

Foram criados scripts para ajudar na identificação de problemas:

- `check_render_db.js` - Verifica a estrutura do banco de dados no Render
- `test_backend.js` - Testa a conexão com o backend
- `test_migrations.js` - Verifica a consistência das migrações
- `check_render_status.js` - Verifica o status do deploy no Render

## 🚀 Passos para Corrigir o Deploy

### 1. Aplicar as migrações faltando

Execute os seguintes comandos no ambiente de produção:

```bash
# Conecte-se ao banco de dados do Render
# Execute as migrações manualmente ou através da aplicação

# Ou execute diretamente no banco:
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_status_id INTEGER DEFAULT 1;
ALTER TABLE transactions ADD CONSTRAINT IF NOT EXISTS fk_transactions_payment_status 
  FOREIGN KEY (payment_status_id) REFERENCES payment_status(id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_status ON transactions(payment_status_id);
```

### 2. Verificar a estrutura do banco de dados

Use o script `check_render_db.js` para verificar se a estrutura está correta:

```bash
node check_render_db.js
```

### 3. Testar a conexão com o backend

Use o script `test_backend.js` para verificar se o backend está respondendo corretamente:

```bash
node test_backend.js
```

### 4. Verificar o status do deploy

Use o script `check_render_status.js` para verificar se o serviço está online:

```bash
node check_render_status.js
```

## 📊 Verificação Pós-Correção

### 1. Verificar logs do Render

Acesse o dashboard do Render e verifique os logs do serviço para garantir que não há erros.

### 2. Testar funcionalidades críticas

- [ ] Login de usuário
- [ ] Criação de transações
- [ ] Visualização de transações
- [ ] Filtros por status de pagamento
- [ ] Relatórios financeiros

### 3. Verificar integração com o frontend

Acesse o frontend no Vercel e verifique se todas as chamadas à API estão funcionando corretamente.

## 🛡️ Prevenção de Problemas Futuros

### 1. Manter consistência entre ambientes

- Sempre que modificar o schema do banco de dados, atualize ambos os arquivos:
  - [init_render_postgresql.sql](file:///Users/nataligiacherini/Development/TrackeOneFinance/database/init_render_postgresql.sql) (para Render)
  - [001_init_postgresql.sql](file:///Users/nataligiacherini/Development/TrackeOneFinance/database/migrations/001_init_postgresql.sql) (para Docker/ambiente local)

### 2. Criar migrações correspondentes

- Para cada migração SQLite, crie uma migração PostgreSQL equivalente
- Use o sufixo `_postgres.sql` para migrações específicas do PostgreSQL

### 3. Testes automatizados

- Implemente testes que verifiquem a estrutura do banco de dados em ambos os ambientes
- Crie testes de integração que validem a comunicação entre frontend e backend

## 📞 Suporte

Se os problemas persistirem após seguir estes passos, entre em contato com:

- Verifique os logs detalhados no Render
- Confirme que as variáveis de ambiente estão configuradas corretamente
- Valide que o DATABASE_URL está correto no arquivo [render.yaml](file:///Users/nataligiacherini/Development/TrackeOneFinance/render.yaml)

---

*Última atualização: 11 de Setembro de 2025*