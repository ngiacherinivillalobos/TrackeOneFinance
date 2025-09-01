# Checklist de Verificação Pós-Deploy

## 1. Verificação do Deploy no Render

### 1.1. Status do Deploy
- [ ] Acesse o painel do Render: https://dashboard.render.com
- [ ] Navegue até o serviço "trackeone-finance-api"
- [ ] Verifique se o status é "Live" (verde)
- [ ] Confirme que o último deploy foi bem-sucedido

### 1.2. Logs do Deploy
- [ ] Verifique os logs da aba "Logs" para garantir que não houve erros
- [ ] Confirme que o build foi concluído com sucesso
- [ ] Verifique se as migrações foram aplicadas corretamente

## 2. Testes da API

### 2.1. Endpoint de Teste Básico
```bash
curl -X GET "https://trackeone-finance-api.onrender.com/api/test"
```
- [ ] Deve retornar: `{"message":"Server is working!","timestamp":"..."}`

### 2.2. Autenticação
```bash
curl -X POST "https://trackeone-finance-api.onrender.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@trackone.com","password":"admin123"}'
```
- [ ] Deve retornar um token JWT

### 2.3. Endpoint do Fluxo de Caixa
```bash
# Substitua TOKEN pelo token obtido no passo anterior
curl -X GET "https://trackeone-finance-api.onrender.com/api/cash-flow?month=08&year=2025&cost_center_id=1" \
  -H "Authorization: Bearer TOKEN"
```
- [ ] Deve retornar uma lista de registros de fluxo de caixa
- [ ] Não deve retornar erro 500

### 2.4. Endpoint de Detalhes de Pagamento
```bash
# Verificar se a tabela payment_details está acessível
curl -X GET "https://trackeone-finance-api.onrender.com/api/test" \
  -H "Authorization: Bearer TOKEN"
```

## 3. Verificação do Banco de Dados

### 3.1. Estrutura das Tabelas
- [ ] A tabela `cash_flow` deve existir com os campos corretos:
  - `id` (SERIAL PRIMARY KEY)
  - `date` (DATE)
  - `description` (TEXT)
  - `amount` (NUMERIC(10,2))
  - `record_type` (TEXT)
  - `category_id` (INTEGER)
  - `subcategory_id` (INTEGER)
  - `cost_center_id` (INTEGER)
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)

- [ ] A tabela `payment_details` deve existir com os campos corretos:
  - `id` (SERIAL PRIMARY KEY)
  - `transaction_id` (INTEGER)
  - `payment_date` (DATE)
  - `paid_amount` (NUMERIC(10,2))
  - `original_amount` (NUMERIC(10,2))
  - `payment_type` (TEXT)
  - `bank_account_id` (INTEGER)
  - `card_id` (INTEGER)
  - `discount_amount` (NUMERIC(10,2))
  - `interest_amount` (NUMERIC(10,2))
  - `observations` (TEXT)
  - `created_at` (TIMESTAMP)

- [ ] As tabelas `category_types` e `payment_status` devem ter sequências configuradas:
  - `category_types.id` deve ser auto-incremento
  - `payment_status.id` deve ser auto-incremento

### 3.2. Tipos de Dados
- [ ] O campo `cash_flow.date` deve ser do tipo DATE
- [ ] O campo `cash_flow.amount` deve ser do tipo NUMERIC(10,2)
- [ ] Todos os campos de data devem estar no formato correto
- [ ] Todos os campos monetários devem estar no formato correto

### 3.3. Teste de Inserção
- [ ] Deve ser possível inserir dados em `category_types` sem especificar o ID
- [ ] Deve ser possível inserir dados em `payment_status` sem especificar o ID
- [ ] As inserções devem usar auto-incremento corretamente

## 4. Funcionalidades do Sistema

### 4.1. Controle Mensal
- [ ] A tela de Controle Mensal deve carregar corretamente
- [ ] Os filtros por mês, ano e centro de custo devem funcionar
- [ ] As transações devem ser exibidas corretamente
- [ ] A funcionalidade de marcar transações como pagas deve funcionar

### 4.2. Fluxo de Caixa
- [ ] A tela de Fluxo de Caixa deve carregar corretamente
- [ ] Os filtros devem funcionar sem erros
- [ ] Os dados devem ser exibidos corretamente
- [ ] Não deve haver erros de CORS

### 4.3. Marcação de Pagamentos
- [ ] Deve ser possível marcar transações como pagas
- [ ] A tabela `payment_details` deve ser preenchida corretamente
- [ ] As informações de pagamento devem ser persistidas

## 5. Monitoramento Contínuo

### 5.1. Logs
- [ ] Monitore os logs do Render por 24 horas após o deploy
- [ ] Verifique se há erros recorrentes
- [ ] Confirme que todas as requisições estão sendo processadas corretamente

### 5.2. Performance
- [ ] Verifique os tempos de resposta da API
- [ ] Confirme que não há degradação de performance
- [ ] Monitore o uso de recursos do servidor

## 6. Rollback (se necessário)

### 6.1. Em caso de problemas críticos
- [ ] Identifique a causa raiz do problema
- [ ] Reverta para o commit anterior se necessário
- [ ] Notifique os usuários sobre o problema
- [ ] Trabalhe na correção e faça um novo deploy

### 6.2. Comandos para rollback
```bash
# Reverter para o commit anterior
git reset --hard HEAD~1
git push --force origin main

# Ou reverter para um commit específico
git reset --hard <commit-hash>
git push --force origin main
```

## 7. Documentação

### 7.1. Atualizações
- [ ] Atualize a documentação do projeto com as mudanças
- [ ] Registre as correções feitas
- [ ] Atualize o CHANGELOG se existir

### 7.2. Lições Aprendidas
- [ ] Documente os problemas encontrados e suas soluções
- [ ] Registre as melhorias para futuros deploys
- [ ] Atualize os guias de deploy se necessário

---

✅ **Deploy concluído com sucesso!**
Se todos os itens desta checklist forem verificados com sucesso, o sistema estará operando corretamente em produção.