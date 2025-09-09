#!/bin/bash

echo "🔍 Verificando se a migração payment_days foi aplicada no PostgreSQL..."

# Teste para verificar se a coluna payment_days existe
echo "Testando criação de centro de custo para verificar se payment_days existe..."

# Fazer login
TOKEN=$(curl -s -X POST "https://trackeone-finance-api.onrender.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "123456"}' | jq -r '.token')

echo "Token obtido: ${TOKEN:0:20}..."

# Testar sem payment_days primeiro
echo ""
echo "🧪 Teste 1: Criando centro de custo SEM payment_days"
curl -s -X POST "https://trackeone-finance-api.onrender.com/api/cost-centers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Teste Sem Payment Days",
    "number": "8888"
  }' | jq '.'

echo ""
echo "🧪 Teste 2: Criando centro de custo COM payment_days"
curl -s -X POST "https://trackeone-finance-api.onrender.com/api/cost-centers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Teste Com Payment Days",
    "number": "7777",
    "payment_days": "5,15,25"
  }' | jq '.'

echo ""
echo "📋 Listando todos os centros de custo para verificar:"
curl -s -X GET "https://trackeone-finance-api.onrender.com/api/cost-centers" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo "✅ Teste de migração concluído"
