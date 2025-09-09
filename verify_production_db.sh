#!/bin/bash

echo "🔍 Verificando estrutura do banco de produção..."
echo "📋 Tabelas disponíveis:"
sqlite3 database/database.db ".tables"

echo ""
echo "📊 Schema da tabela cost_centers:"
sqlite3 database/database.db ".schema cost_centers"

echo ""
echo "📈 Verificando se há dados na tabela cost_centers:"
sqlite3 database/database.db "SELECT COUNT(*) as total_registros FROM cost_centers;"

echo ""
echo "✅ Verificação concluída!"
