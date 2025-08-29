#!/bin/bash

# Script para verificar e aplicar migração de parcelamento
echo "=== Verificando estrutura da tabela transactions ==="

cd /Users/nataligiacherini/Development/TrackeOneFinance/server

# Verificar se os campos existem
echo "Estrutura atual da tabela:"
sqlite3 database/database.db ".schema transactions"

echo ""
echo "=== Verificando se campos de parcelamento existem ==="
RESULT=$(sqlite3 database/database.db "PRAGMA table_info(transactions);" | grep -E "(is_installment|installment_number|total_installments)")

if [ -z "$RESULT" ]; then
    echo "❌ Campos de parcelamento NÃO encontrados. Aplicando migração..."
    
    # Aplicar migração
    sqlite3 database/database.db << 'EOF'
ALTER TABLE transactions ADD COLUMN is_installment BOOLEAN DEFAULT 0;
ALTER TABLE transactions ADD COLUMN installment_number INTEGER DEFAULT NULL;  
ALTER TABLE transactions ADD COLUMN total_installments INTEGER DEFAULT NULL;
EOF

    echo "✅ Migração aplicada com sucesso!"
    
    # Verificar novamente
    echo ""
    echo "Verificando novamente..."
    sqlite3 database/database.db "PRAGMA table_info(transactions);" | grep -E "(is_installment|installment_number|total_installments)"
    
else
    echo "✅ Campos de parcelamento já existem:"
    echo "$RESULT"
fi

echo ""
echo "=== Estrutura final da tabela ==="
sqlite3 database/database.db ".schema transactions"