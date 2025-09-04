#!/bin/bash

# Script para verificar e aplicar todas as migrações necessárias
echo "=== Verificando e aplicando todas as migrações ==="

cd /Users/nataligiacherini/Development/TrackeOneFinance/server

# Verificar se o banco de dados existe
if [ ! -f "database/database.db" ]; then
    echo "❌ Banco de dados não encontrado. Execute o script de inicialização primeiro."
    exit 1
fi

echo "=== Verificando estrutura da tabela transactions ==="
echo "Estrutura atual da tabela:"
sqlite3 database/database.db ".schema transactions"

echo ""
echo "=== Verificando campos de parcelamento ==="
RESULT=$(sqlite3 database/database.db "PRAGMA table_info(transactions);" | grep -E "(is_installment|installment_number|total_installments)")

if [ -z "$RESULT" ]; then
    echo "❌ Campos de parcelamento NÃO encontrados. Aplicando migração..."
    
    # Aplicar migração de campos de parcelamento
    sqlite3 database/database.db < ../database/migrations/add_installment_fields.sql
    
    echo "✅ Migração de campos de parcelamento aplicada com sucesso!"
else
    echo "✅ Campos de parcelamento já existem:"
    echo "$RESULT"
fi

echo ""
echo "=== Verificando campos de recorrência ==="
RESULT_RECURRING=$(sqlite3 database/database.db "PRAGMA table_info(transactions);" | grep -E "(is_recurring|recurrence_type|recurrence_count|recurrence_end_date)")

if [ -z "$RESULT_RECURRING" ]; then
    echo "❌ Campos de recorrência NÃO encontrados. Aplicando migração..."
    
    # Aplicar migração de campos de recorrência
    sqlite3 database/database.db < ../database/migrations/add_recurring_fields_sqlite.sql
    
    echo "✅ Migração de campos de recorrência aplicada com sucesso!"
else
    echo "✅ Campos de recorrência já existem:"
    echo "$RESULT_RECURRING"
fi

echo ""
echo "=== Ajustando valores booleanos ==="
echo "Aplicando ajustes para garantir que valores booleanos sejam 0 ou 1..."

# Aplicar ajustes nos valores booleanos
sqlite3 database/database.db < ../database/migrations/fix_boolean_values_sqlite.sql

echo "✅ Ajustes de valores booleanos aplicados com sucesso!"

echo ""
echo "=== Estrutura final da tabela ==="
sqlite3 database/database.db ".schema transactions"

echo ""
echo "=== Verificação de valores booleanos ==="
echo "Valores na coluna is_installment:"
sqlite3 database/database.db "SELECT DISTINCT is_installment FROM transactions;"

echo "Valores na coluna is_recurring:"
sqlite3 database/database.db "SELECT DISTINCT is_recurring FROM transactions;"

echo ""
echo "✅ Todas as migrações foram aplicadas com sucesso!"