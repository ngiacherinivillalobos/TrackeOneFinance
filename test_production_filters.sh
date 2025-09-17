#!/bin/bash

# Script para testar filtros em produção
API_BASE="https://trackeone-finance-api.onrender.com/api"

echo "🔄 Testando filtros em produção..."
echo ""

# 1. Fazer login
echo "1. Fazendo login..."
TOKEN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}')

TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Falha no login: $TOKEN_RESPONSE"
  exit 1
fi

echo "✅ Login realizado com sucesso"
echo ""

# 2. Testar categorias
echo "2. Testando categorias..."
CATEGORIES_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/categories")

if echo "$CATEGORIES_RESPONSE" | grep -q '"error"'; then
  echo "❌ Falha ao carregar categorias: $CATEGORIES_RESPONSE"
else
  CATEGORIES_COUNT=$(echo "$CATEGORIES_RESPONSE" | grep -o '"id":' | wc -l | xargs)
  echo "✅ Categorias carregadas: $CATEGORIES_COUNT itens"
  echo "   Primeiras categorias:"
  echo "$CATEGORIES_RESPONSE" | head -c 200
  echo "..."
fi
echo ""

# 3. Testar subcategorias
echo "3. Testando subcategorias..."
SUBCATEGORIES_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/subcategories")

if echo "$SUBCATEGORIES_RESPONSE" | grep -q '"error"'; then
  echo "❌ Falha ao carregar subcategorias: $SUBCATEGORIES_RESPONSE"
else
  SUBCATEGORIES_COUNT=$(echo "$SUBCATEGORIES_RESPONSE" | grep -o '"id":' | wc -l | xargs)
  echo "✅ Subcategorias carregadas: $SUBCATEGORIES_COUNT itens"
  echo "   Primeiras subcategorias:"
  echo "$SUBCATEGORIES_RESPONSE" | head -c 200
  echo "..."
fi
echo ""

# 4. Testar centros de custo
echo "4. Testando centros de custo..."
COST_CENTERS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/cost-centers")

if echo "$COST_CENTERS_RESPONSE" | grep -q '"error"'; then
  echo "❌ Falha ao carregar centros de custo: $COST_CENTERS_RESPONSE"
else
  COST_CENTERS_COUNT=$(echo "$COST_CENTERS_RESPONSE" | grep -o '"id":' | wc -l | xargs)
  echo "✅ Centros de custo carregados: $COST_CENTERS_COUNT itens"
  echo "   Resposta completa:"
  echo "$COST_CENTERS_RESPONSE"
fi
echo ""

# 5. Testar status de pagamento
echo "5. Testando status de pagamento..."
PAYMENT_STATUS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE/payment-status")

if echo "$PAYMENT_STATUS_RESPONSE" | grep -q '"error"'; then
  echo "❌ Falha ao carregar status de pagamento: $PAYMENT_STATUS_RESPONSE"
else
  PAYMENT_STATUS_COUNT=$(echo "$PAYMENT_STATUS_RESPONSE" | grep -o '"id":' | wc -l | xargs)
  echo "✅ Status de pagamento carregados: $PAYMENT_STATUS_COUNT itens"
  echo "   Resposta completa:"
  echo "$PAYMENT_STATUS_RESPONSE"
fi
echo ""

echo "🎉 Teste de filtros concluído!"