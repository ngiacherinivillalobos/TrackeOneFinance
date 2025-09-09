#!/bin/bash

echo "🔍 Testando API de Centro de Custo em Produção..."
echo ""

# Teste 1: Listar centros de custo
echo "📋 1. Listando centros de custo existentes:"
curl -s -X GET "https://trackeone-finance-api.onrender.com/api/cost-centers" \
  -H "Authorization: Bearer test" | jq '.' || echo "Erro: Token necessário"

echo ""
echo ""

# Teste 2: Criar um centro de custo com payment_days
echo "➕ 2. Criando centro de custo com dias de recebimento:"
curl -s -X POST "https://trackeone-finance-api.onrender.com/api/cost-centers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test" \
  -d '{
    "name": "Teste Payment Days",
    "number": "001",
    "payment_days": "5,15,25"
  }' | jq '.' || echo "Erro na criação"

echo ""
echo ""

# Teste 3: Listar novamente para ver se foi criado
echo "📋 3. Listando novamente para verificar criação:"
curl -s -X GET "https://trackeone-finance-api.onrender.com/api/cost-centers" \
  -H "Authorization: Bearer test" | jq '.' || echo "Erro: Token necessário"

echo ""
echo "✅ Teste concluído!"
