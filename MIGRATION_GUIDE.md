# 🔄 Guia de Migração: SQLite (Desenvolvimento) para PostgreSQL (Produção)

## 📋 Visão Geral

Este guia detalha o processo de migração de dados do SQLite (ambiente de desenvolvimento) para PostgreSQL (ambiente de produção) no TrackeOne Finance.

## 📁 Estrutura de Arquivos de Banco de Dados

### Banco de Dados de Desenvolvimento (SQLite)
- **Localização**: `database/track_one_finance.db`
- **Tipo**: Arquivo SQLite local

### Banco de Dados de Produção (PostgreSQL)
- **Serviço**: PostgreSQL no Render
- **Conexão**: Variável de ambiente `DATABASE_URL`

## 🛠 Processo de Migração

### 1. Exportar Dados do SQLite

#### 1.1. Criar Script de Exportação

Crie um script para exportar os dados do SQLite:

```bash
#!/bin/bash
# export_sqlite_data.sh

echo "Exportando dados do SQLite..."

# Exportar estrutura do banco
sqlite3 database/track_one_finance.db .schema > sqlite_schema.sql

# Exportar dados das tabelas principais
sqlite3 database/track_one_finance.db ".mode insert category_types" "select * from category_types;" > category_types_data.sql
sqlite3 database/track_one_finance.db ".mode insert categories" "select * from categories;" > categories_data.sql
sqlite3 database/track_one_finance.db ".mode insert subcategories" "select * from subcategories;" > subcategories_data.sql
sqlite3 database/track_one_finance.db ".mode insert payment_status" "select * from payment_status;" > payment_status_data.sql
sqlite3 database/track_one_finance.db ".mode insert bank_accounts" "select * from bank_accounts;" > bank_accounts_data.sql
sqlite3 database/track_one_finance.db ".mode insert cards" "select * from cards;" > cards_data.sql
sqlite3 database/track_one_finance.db ".mode insert contacts" "select * from contacts;" > contacts_data.sql
sqlite3 database/track_one_finance.db ".mode insert cost_centers" "select * from cost_centers;" > cost_centers_data.sql
sqlite3 database/track_one_finance.db ".mode insert transactions" "select * from transactions;" > transactions_data.sql

echo "Exportação concluída!"
```

### 2. Converter Dados para PostgreSQL

#### 2.1. Adaptar SQL para PostgreSQL

Os principais ajustes necessários:

1. **Tipos de Dados**:
   - `INTEGER PRIMARY KEY AUTOINCREMENT` → `SERIAL PRIMARY KEY`
   - `DATETIME` → `TIMESTAMP`
   - `DECIMAL(10,2)` → `NUMERIC(10,2)`

2. **Inserts**:
   - `INSERT OR IGNORE` → `INSERT ... ON CONFLICT DO NOTHING`

3. **Sequências**:
   - Ajustar sequências após inserção de dados

#### 2.2. Script de Conversão

```javascript
// convert_sqlite_to_postgres.js
const fs = require('fs');

// Função para converter SQL do SQLite para PostgreSQL
const convertSQLiteToPostgreSQL = (sqlContent) => {
  // Substituir tipos de dados
  let converted = sqlContent
    .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'SERIAL PRIMARY KEY')
    .replace(/DATETIME/g, 'TIMESTAMP')
    .replace(/INSERT OR IGNORE/g, 'INSERT')
    .replace(/INSERT(.+?VALUES\s*\(.+?\))/g, 'INSERT $1 ON CONFLICT DO NOTHING');
  
  return converted;
};

// Converter arquivos
const files = [
  'category_types_data.sql',
  'categories_data.sql',
  'subcategories_data.sql',
  'payment_status_data.sql',
  'bank_accounts_data.sql',
  'cards_data.sql',
  'contacts_data.sql',
  'cost_centers_data.sql',
  'transactions_data.sql'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const converted = convertSQLiteToPostgreSQL(content);
    fs.writeFileSync(`postgres_${file}`, converted);
    console.log(`Convertido: ${file}`);
  }
});

console.log('Conversão concluída!');
```

### 3. Importar Dados para PostgreSQL

#### 3.1. Configurar Conexão

Instale o cliente PostgreSQL:

```bash
npm install pg
```

#### 3.2. Script de Importação

```javascript
// import_to_postgres.js
const { Client } = require('pg');
const fs = require('fs');

// Configuração da conexão (substitua pela sua DATABASE_URL)
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const importData = async () => {
  try {
    await client.connect();
    console.log('Conectado ao PostgreSQL');

    // Ordem importante para manter integridade referencial
    const files = [
      'postgres_category_types_data.sql',
      'postgres_payment_status_data.sql',
      'postgres_cost_centers_data.sql',
      'postgres_contacts_data.sql',
      'postgres_bank_accounts_data.sql',
      'postgres_cards_data.sql',
      'postgres_categories_data.sql',
      'postgres_subcategories_data.sql',
      'postgres_transactions_data.sql'
    ];

    for (const file of files) {
      if (fs.existsSync(file)) {
        const sql = fs.readFileSync(file, 'utf8');
        await client.query(sql);
        console.log(`Importado: ${file}`);
      }
    }

    console.log('Importação concluída com sucesso!');
  } catch (error) {
    console.error('Erro na importação:', error);
  } finally {
    await client.end();
  }
};

importData();
```

## 🚀 Processo Automatizado de Migração

### Script Completo de Migração

```bash
#!/bin/bash
# migrate_to_production.sh

echo "🔄 Iniciando migração do SQLite para PostgreSQL..."

# Verificar se o banco SQLite existe
if [ ! -f "database/track_one_finance.db" ]; then
  echo "❌ Banco de dados SQLite não encontrado!"
  exit 1
fi

# Exportar dados do SQLite
echo "📤 Exportando dados do SQLite..."
sqlite3 database/track_one_finance.db .schema > sqlite_schema.sql

# Exportar dados das tabelas
TABLES=("category_types" "categories" "subcategories" "payment_status" "bank_accounts" "cards" "contacts" "cost_centers" "transactions")

for table in "${TABLES[@]}"; do
  echo "Exportando $table..."
  sqlite3 database/track_one_finance.db ".mode insert $table" "select * from $table;" > "${table}_data.sql"
done

echo "✅ Dados exportados do SQLite!"

# Converter para PostgreSQL
echo "🔄 Convertendo para PostgreSQL..."
node convert_sqlite_to_postgres.js

echo "✅ Conversão concluída!"

# Importar para PostgreSQL
echo "📥 Importando para PostgreSQL..."
node import_to_postgres.js

echo "✅ Migração concluída!"

# Limpar arquivos temporários
echo "🧹 Limpando arquivos temporários..."
rm -f *_data.sql
rm -f postgres_*_data.sql
rm -f sqlite_schema.sql

echo "✅ Limpeza concluída!"
```

## 📋 Considerações Importantes

### 1. Sequências no PostgreSQL

Após a importação, é importante ajustar as sequências:

```sql
-- Ajustar sequências após importação
SELECT setval('category_types_id_seq', (SELECT MAX(id) FROM category_types));
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
SELECT setval('subcategories_id_seq', (SELECT MAX(id) FROM subcategories));
SELECT setval('payment_status_id_seq', (SELECT MAX(id) FROM payment_status));
SELECT setval('bank_accounts_id_seq', (SELECT MAX(id) FROM bank_accounts));
SELECT setval('cards_id_seq', (SELECT MAX(id) FROM cards));
SELECT setval('contacts_id_seq', (SELECT MAX(id) FROM contacts));
SELECT setval('cost_centers_id_seq', (SELECT MAX(id) FROM cost_centers));
SELECT setval('transactions_id_seq', (SELECT MAX(id) FROM transactions));
```

### 2. Dados Sensíveis

- Não versione arquivos de exportação de dados em repositórios públicos
- Use variáveis de ambiente para credenciais
- Considere criptografia para dados sensíveis

### 3. Testes

Antes de migrar dados reais:
1. Teste o processo com dados de exemplo
2. Verifique a integridade referencial
3. Valide os tipos de dados convertidos
4. Confirme o funcionamento da aplicação com o novo banco

## 🆘 Troubleshooting

### Problemas Comuns e Soluções

#### 1. Erros de Integridade Referencial
- Certifique-se de importar tabelas na ordem correta
- Verifique se todas as chaves estrangeiras existem

#### 2. Problemas de Codificação
- Use UTF-8 para todos os arquivos
- Verifique caracteres especiais nos dados

#### 3. Erros de Tipo de Dados
- Confirme a conversão de tipos entre SQLite e PostgreSQL
- Verifique campos monetários e datas

#### 4. Problemas de Conexão
- Verifique a string de conexão DATABASE_URL
- Confirme que o PostgreSQL está acessível
- Verifique as credenciais de acesso

## 📊 Verificação Pós-Migração

### 1. Verificar Contagem de Registros
```sql
SELECT 'category_types' as table_name, COUNT(*) as count FROM category_types
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions;
```

### 2. Verificar Dados Mais Recentes
```sql
SELECT * FROM transactions ORDER BY created_at DESC LIMIT 5;
```

### 3. Testar Funcionalidades da Aplicação
- Login e autenticação
- Criação de novas transações
- Filtros e buscas
- Relatórios e dashboards

## 📝 Conclusão

Este guia fornece um processo completo para migrar dados do ambiente de desenvolvimento (SQLite) para produção (PostgreSQL). Siga os passos cuidadosamente e sempre faça backup dos dados antes de iniciar a migração.

Para migrações futuras, considere implementar um processo automatizado que possa ser executado com um único comando.