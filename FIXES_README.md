# Correções para Problemas em Produção

Este documento descreve as correções implementadas para resolver os seguintes problemas identificados em produção:

## Problemas Identificados

1. **Exibir transações vencidas de todo período**
   - Transações vencidas (não pagas com data anterior a hoje) não estavam sendo exibidas corretamente em todos os períodos

2. **Data Alvo - Configuração de Meta de Economia (d-1)**
   - A data alvo na configuração de meta de economia estava sendo salva com um dia a menos em produção

3. **Data de Pagamento em Transações (d-1)**
   - Ao marcar uma transação como paga, a data de pagamento estava sendo salva com um dia a menos em produção

## Soluções Implementadas

### 1. Exibir transações vencidas de todo período

**Arquivo modificado**: `client/src/pages/MonthlyControl.tsx`

**Mudanças**:
- Atualizado o método `loadTransactions` para sempre buscar transações vencidas independentemente do filtro de data
- Combinar transações vencidas com transações do período selecionado
- Garantir que transações vencidas sejam exibidas mesmo quando filtros de data são aplicados

### 2. Data Alvo - Configuração de Meta de Economia (d-1)

**Arquivo modificado**: `client/src/components/SavingsGoalSettings.tsx`
**Função auxiliar**: `client/src/utils/dateUtils.ts`

**Mudanças**:
- Uso da função `formatDateToLocal` para formatar datas corretamente
- Criação de datas com horário fixo (12:00:00) para evitar conversões de timezone
- Formatação correta de datas para o formato YYYY-MM-DD

### 3. Data de Pagamento em Transações (d-1)

**Arquivos modificados**:
- `server/src/controllers/transactionController.ts`
- `database/migrations/add_payment_date_to_transactions.sql`
- `database/migrations/add_payment_date_to_transactions_postgres.sql`

**Mudanças**:
- Adicionada coluna `payment_date` na tabela `transactions`
- Atualizada função `markAsPaid` para processar corretamente a data de pagamento
- Adicionada lógica para evitar problemas de timezone
- Atualizada função `reversePayment` para limpar a data de pagamento ao estornar
- Mantida integração com tabela `payment_details` para detalhes de pagamento

## Migrações de Banco de Dados

### SQLite
```sql
ALTER TABLE transactions ADD COLUMN payment_date DATE;
```

### PostgreSQL
```sql
ALTER TABLE transactions ADD COLUMN payment_date DATE;
CREATE INDEX IF NOT EXISTS idx_transactions_payment_date ON transactions(payment_date);
```

## Scripts Disponíveis

1. **`apply_all_migrations.sh`** - Aplica todas as migrações necessárias para SQLite
2. **`apply_postgres_migrations.js`** - Aplica migrações para PostgreSQL
3. **`test_payment_date_fix.js`** - Testa se as correções foram aplicadas corretamente
4. **`deploy_fixes.sh`** - Script completo para aplicar todas as correções

## Como Aplicar as Correções

### Em Desenvolvimento
```bash
# Aplicar migrações
sh apply_all_migrations.sh

# Testar correções
node test_payment_date_fix.js
```

### Em Produção
```bash
# Aplicar todas as correções
sh deploy_fixes.sh
```

## Verificação

Após aplicar as correções, verifique:

1. Transações vencidas aparecem em todos os filtros de período
2. Datas de meta de economia são salvas corretamente sem o problema d-1
3. Datas de pagamento são salvas corretamente sem o problema d-1
4. Estorno de pagamentos limpa corretamente as datas de pagamento

## Benefícios

1. **Consistência de dados** - Datas são tratadas de forma consistente entre ambientes
2. **Melhor experiência do usuário** - Transações vencidas são sempre visíveis
3. **Manutenção facilitada** - Funções reutilizáveis para tratamento de datas
4. **Compatibilidade** - Solução funciona tanto em SQLite (desenvolvimento) quanto PostgreSQL (produção)