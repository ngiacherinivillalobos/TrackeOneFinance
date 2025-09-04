# Migração de Valores Booleanos nas Tabelas Transactions

## Problema Identificado

O problema relatado era que as tabelas `transactions` nos ambientes de desenvolvimento (SQLite) e produção (PostgreSQL) não estavam considerando os valores booleanos como 0 ou 1, mas sim como `[v]` ou outros formatos inconsistentes.

## Soluções Implementadas

### 1. Atualização dos Esquemas Iniciais

Foram atualizados os arquivos de esquema inicial para incluir os campos de parcelamento desde a criação do banco de dados:

- `database/initial.sql` (SQLite)
- `database/initial_postgres.sql` (PostgreSQL)

Ambos agora incluem os campos:
- `is_installment BOOLEAN DEFAULT 0/false`
- `installment_number INTEGER DEFAULT NULL`
- `total_installments INTEGER DEFAULT NULL`

### 2. Criação de Migrações

Foram criadas migrações para adicionar os campos faltantes:

- `database/migrations/add_installment_fields.sql` - Adiciona campos de parcelamento ao SQLite
- `database/migrations/add_installment_fields_postgres.sql` - Adiciona campos de parcelamento ao PostgreSQL
- `database/migrations/add_recurring_fields_sqlite.sql` - Adiciona campos de recorrência ao SQLite
- `database/migrations/add_recurring_fields_postgres.sql` - Adiciona campos de recorrência ao PostgreSQL

### 3. Ajuste de Valores Booleanos

Foram criadas migrações específicas para garantir que os valores booleanos sejam tratados como 0/1 no SQLite e true/false no PostgreSQL:

- `database/migrations/fix_boolean_values_sqlite.sql` - Ajusta valores booleanos no SQLite
- `database/migrations/fix_boolean_values_postgres.sql` - Ajusta valores booleanos no PostgreSQL

### 4. Scripts de Aplicação de Migrações

Foram criados scripts para facilitar a aplicação das migrações:

- `apply_all_migrations.sh` - Script para aplicar todas as migrações no ambiente SQLite
- `apply_postgres_migrations.js` - Script para aplicar todas as migrações no ambiente PostgreSQL

### 5. Atualização do Código do Backend

Foi criada uma função utilitária para tratar consistentemente os valores booleanos entre os ambientes:

- `server/src/utils/booleanUtils.ts` - Funções para converter valores booleanos de forma consistente

O TransactionController foi atualizado para usar essas funções:
- `server/src/controllers/TransactionController.ts` - Uso das funções utilitárias

## Como Aplicar as Migrações

### Ambiente de Desenvolvimento (SQLite)

```bash
cd /Users/nataligiacherini/Development/TrackeOneFinance
./apply_all_migrations.sh
```

### Ambiente de Produção (PostgreSQL)

```bash
cd /Users/nataligiacherini/Development/TrackeOneFinance
node apply_postgres_migrations.js
```

## Verificação

Foram criados scripts de teste para verificar se as migrações foram aplicadas corretamente:

- `test_migrations.js` - Verifica a estrutura da tabela e valores booleanos no SQLite

## Benefícios

1. **Consistência**: Os valores booleanos agora são tratados de forma consistente entre os ambientes
2. **Compatibilidade**: O sistema funciona corretamente tanto no SQLite quanto no PostgreSQL
3. **Manutenibilidade**: As migrações são versionadas e podem ser aplicadas de forma controlada
4. **Robustez**: O código do backend trata os valores booleanos de forma segura em ambos os ambientes

## Considerações Finais

Com essas mudanças, o sistema agora:
- Trata valores booleanos como 0/1 no SQLite e true/false no PostgreSQL
- Tem todos os campos necessários para transações parceladas e recorrentes
- Mantém consistência entre os ambientes de desenvolvimento e produção
- Facilita a manutenção futura com migrações versionadas