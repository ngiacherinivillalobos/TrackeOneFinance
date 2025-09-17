#!/bin/bash

echo "🔍 Comparando dados entre desenvolvimento e produção..."
echo ""

# URLs
DEV_API="http://localhost:3001/api"
PROD_API="https://trackeone-finance-api.onrender.com/api"

# Fazer login em produção
echo "1. Fazendo login em produção..."
PROD_TOKEN=$(curl -s -X POST "$PROD_API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}' | \
  grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$PROD_TOKEN" ]; then
  echo "❌ Falha no login em produção"
  exit 1
fi
echo "✅ Login em produção realizado"

# Tentar fazer login em desenvolvimento (pode não ter usuário)
echo ""
echo "2. Testando desenvolvimento..."
DEV_LOGIN=$(curl -s -X POST "$DEV_API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}' 2>/dev/null)

if echo "$DEV_LOGIN" | grep -q '"token"'; then
  DEV_TOKEN=$(echo "$DEV_LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  echo "✅ Login em desenvolvimento realizado"
  HAS_DEV_AUTH=true
else
  echo "⚠️  Sem usuário em desenvolvimento, testando sem autenticação..."
  HAS_DEV_AUTH=false
fi

echo ""
echo "=== COMPARAÇÃO DE DADOS ==="

# Função para comparar endpoints
compare_endpoint() {
  local endpoint=$1
  local name=$2
  
  echo ""
  echo "📊 $name:"
  
  # Produção (sempre com auth)
  PROD_DATA=$(curl -s -H "Authorization: Bearer $PROD_TOKEN" "$PROD_API/$endpoint")
  
  if echo "$PROD_DATA" | grep -q '"error"'; then
    echo "❌ PRODUÇÃO: Erro - $PROD_DATA"
    PROD_COUNT=0
  else
    PROD_COUNT=$(echo "$PROD_DATA" | grep -o '"id":' | wc -l | xargs)
    echo "✅ PRODUÇÃO: $PROD_COUNT itens"
    
    # Mostrar alguns exemplos
    if [ "$PROD_COUNT" -gt 0 ]; then
      echo "   Exemplos produção:"
      echo "$PROD_DATA" | head -c 300 | sed 's/^/   /'
      echo "   ..."
    fi
  fi
  
  # Desenvolvimento
  if [ "$HAS_DEV_AUTH" = true ]; then
    DEV_DATA=$(curl -s -H "Authorization: Bearer $DEV_TOKEN" "$DEV_API/$endpoint")
  else
    DEV_DATA=$(curl -s "$DEV_API/$endpoint")
  fi
  
  if echo "$DEV_DATA" | grep -q '"error"'; then
    echo "❌ DESENVOLVIMENTO: Erro - $DEV_DATA"
    DEV_COUNT=0
  else
    DEV_COUNT=$(echo "$DEV_DATA" | grep -o '"id":' | wc -l | xargs)
    echo "✅ DESENVOLVIMENTO: $DEV_COUNT itens"
    
    # Mostrar alguns exemplos se houver dados
    if [ "$DEV_COUNT" -gt 0 ]; then
      echo "   Exemplos desenvolvimento:"
      echo "$DEV_DATA" | head -c 300 | sed 's/^/   /'
      echo "   ..."
    fi
  fi
  
  # Comparação
  if [ "$PROD_COUNT" -eq "$DEV_COUNT" ]; then
    echo "✅ IGUAL: Ambos têm $PROD_COUNT itens"
  else
    echo "⚠️  DIFERENÇA: Produção($PROD_COUNT) vs Desenvolvimento($DEV_COUNT)"
  fi
}

# Comparar todos os endpoints de filtros
compare_endpoint "categories" "CATEGORIAS"
compare_endpoint "subcategories" "SUBCATEGORIAS"  
compare_endpoint "cost-centers" "CENTROS DE CUSTO"
compare_endpoint "payment-statuses" "STATUS DE PAGAMENTO"

echo ""
echo "🎉 Comparação concluída!"