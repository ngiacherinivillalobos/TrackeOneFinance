# 🛠️ Correção para Migrações do PostgreSQL no Render

## 🎯 Problema Identificado

O serviço backend no Render pode não estar iniciando corretamente devido a problemas com as migrações do PostgreSQL, especialmente a migração da tabela `credit_card_transactions`.

## 🔧 Solução

### Passo 1: Aplicar Migrações Manualmente no Render

1. Acesse o dashboard do Render: https://dashboard.render.com
2. Vá para o serviço "trackeone-finance-api"
3. Clique na aba "Shell" (se disponível)
4. Execute o script de migração:

```bash
cd server
npm run migrate:postgres
```

Se o comando acima não funcionar, tente:

```bash
cd server
node ../database/migrations/apply_credit_card_transactions_postgres.js
```

### Passo 2: Verificar Logs do Serviço

1. No dashboard do Render, vá para o serviço backend
2. Clique na aba "Logs"
3. Procure por erros relacionados a:
   - Database connection
   - Migrations
   - credit_card_transactions
   - PostgreSQL errors

### Passo 3: Corrigir Variáveis de Ambiente

Verifique se as seguintes variáveis de ambiente estão configuradas corretamente:

```
NODE_ENV=production
DATABASE_URL=postgresql://[usuário]:[senha]@[host]:[porta]/[nome_do_banco]
JWT_SECRET=[sua_chave_secreta]
PORT=3001
FRONTEND_URL=https://seu-frontend.onrender.com
```

### Passo 4: Forçar Redeploy

1. No dashboard do Render, vá para o serviço backend
2. Clique em "Manual Deploy" → "Clear build cache & deploy"
3. Aguarde o redeploy completo

## 📋 Diagnóstico de Erros Comuns

### 1. Erro de Conexão com Banco de Dados

**Mensagem**: `Error: connect ECONNREFUSED` ou similar

**Solução**:
- Verifique se DATABASE_URL está correta
- Confirme que o banco de dados PostgreSQL está acessível
- Verifique credenciais de acesso

### 2. Erro na Criação da Tabela

**Mensagem**: `relation "credit_card_transactions" does not exist` ou similar

**Solução**:
- Execute manualmente o script de migração
- Verifique se as tabelas dependentes existem (categories, subcategories, cards)

### 3. Erro de Permissões

**Mensagem**: `permission denied for table` ou similar

**Solução**:
- Verifique se o usuário do banco tem permissões adequadas
- Confirme que o usuário pode criar tabelas e índices

## 🚀 Comandos de Diagnóstico

### Verificar Estrutura do Banco

Conecte-se ao PostgreSQL e execute:

```sql
-- Listar todas as tabelas
\dt

-- Verificar se a tabela existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'credit_card_transactions'
);

-- Verificar estrutura da tabela
\d credit_card_transactions
```

### Testar Conexão com Banco

```bash
# No shell do Render
psql $DATABASE_URL -c "SELECT version();"
```

## 📞 Suporte

Se os problemas persistirem:

1. Colete os logs completos do serviço
2. Verifique se há erros durante o build
3. Confirme que todas as dependências estão instaladas
4. Entre em contato com o suporte do Render se necessário

## 📄 Referências

- Documentação do Render: https://render.com/docs
- PostgreSQL Documentation: https://www.postgresql.org/docs/