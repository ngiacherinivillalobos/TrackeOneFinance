#!/bin/bash

# Script para aplicar a migração da tabela de transações de cartão de crédito
echo "=== Aplicando migração da tabela de transações de cartão de crédito ==="

cd /Users/nataligiacherini/Development/TrackeOneFinance/server

# Verificar se o banco de dados existe
if [ ! -f "../database/track_one_finance.db" ]; then
    echo "❌ Banco de dados não encontrado. Execute o script de inicialização primeiro."
    exit 1
fi

echo "=== Verificando se a tabela credit_card_transactions já existe ==="
RESULT=$(sqlite3 ../database/track_one_finance.db ".tables" | grep "credit_card_transactions")

if [ -z "$RESULT" ]; then
    echo "❌ Tabela credit_card_transactions NÃO encontrada. Aplicando migração..."
    
    # Aplicar migração da tabela de transações de cartão de crédito
    sqlite3 ../database/track_one_finance.db < ../database/migrations/create_credit_card_transactions_table_sqlite.sql
    
    echo "✅ Migração da tabela credit_card_transactions aplicada com sucesso!"
else
    echo "✅ Tabela credit_card_transactions já existe"
fi

echo ""
echo "=== Estrutura da tabela credit_card_transactions ==="
sqlite3 ../database/track_one_finance.db ".schema credit_card_transactions"

echo ""
echo "✅ Migração da tabela de transações de cartão de crédito concluída!"