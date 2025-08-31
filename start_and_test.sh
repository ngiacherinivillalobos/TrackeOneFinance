#!/bin/bash

# Script para iniciar o servidor e testar a conexão

echo "=== Iniciando Servidor TrackOne Finance ==="
echo "Iniciando servidor em background..."

# Iniciar o servidor em background
cd server
npm run dev > server.log 2>&1 &
SERVER_PID=$!
cd ..

echo "Servidor iniciado com PID: $SERVER_PID"
echo "Aguardando inicialização..."

# Aguardar alguns segundos para o servidor iniciar
sleep 10

echo "Verificando se o servidor está respondendo..."

# Testar o endpoint de teste
if curl -s -f http://localhost:3001/api/test > /dev/null; then
    echo "✅ Servidor está respondendo!"
    echo "Resultado do teste:"
    curl -s http://localhost:3001/api/test | jq .
else
    echo "❌ Servidor não está respondendo"
    echo "Verificando logs..."
    tail -20 server/server.log
fi

echo ""
echo "Para parar o servidor, execute: kill $SERVER_PID"