#!/bin/bash

# Test Filters Endpoints - TrackeOne Finance
# Testa especificamente os endpoints de filtros (Categories, Subcategories, Cost Centers)

echo "🔍 Testando Endpoints dos Filtros - TrackeOne Finance"
echo "📅 $(date)"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="https://trackeone-backend.onrender.com"
MAX_WAIT_MINUTES=10
WAIT_COUNT=0

# Função para aguardar o servidor estar online
wait_for_server() {
    echo "⏳ Aguardando servidor estar online..."
    
    while [ $WAIT_COUNT -lt $MAX_WAIT_MINUTES ]; do
        WAIT_COUNT=$((WAIT_COUNT + 1))
        echo -n "  Tentativa $WAIT_COUNT/$MAX_WAIT_MINUTES: "
        
        # Testa se o servidor responde sem x-render-routing: no-server
        HEADERS=$(curl -s -I "$BASE_URL/" 2>/dev/null)
        
        if echo "$HEADERS" | grep -q "x-render-routing: no-server"; then
            echo -e "${YELLOW}Deploy em progresso...${NC}"
        elif echo "$HEADERS" | head -1 | grep -q "200\|404"; then
            echo -e "${GREEN}Servidor online!${NC}"
            return 0
        else
            echo -e "${RED}Servidor não responde${NC}"
        fi
        
        sleep 30  # Aguarda 30 segundos entre tentativas
    done
    
    echo -e "${RED}❌ Timeout: Servidor não ficou online${NC}"
    return 1
}

# Função para testar endpoint sem autenticação
test_endpoint() {
    local endpoint="$1"
    local name="$2"
    
    echo -n "🔍 Testando $name: "
    
    # Testa o endpoint
    RESPONSE=$(curl -s "$BASE_URL/api/$endpoint" 2>/dev/null)
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/$endpoint" 2>/dev/null)
    
    case "$HTTP_CODE" in
        "200")
            if echo "$RESPONSE" | jq . >/dev/null 2>&1; then
                COUNT=$(echo "$RESPONSE" | jq 'length' 2>/dev/null || echo "?")
                echo -e "${GREEN}✅ OK (${COUNT} registros)${NC}"
                return 0
            else
                echo -e "${YELLOW}⚠️  Resposta inválida${NC}"
                return 1
            fi
            ;;
        "401")
            echo -e "${YELLOW}🔒 Precisa autenticação (normal)${NC}"
            return 0
            ;;
        "404")
            echo -e "${RED}❌ Endpoint não encontrado${NC}"
            return 1
            ;;
        "500")
            echo -e "${RED}❌ ERRO 500 - Problema no servidor${NC}"
            echo "   Resposta: $(echo "$RESPONSE" | head -c 100)..."
            return 1
            ;;
        *)
            echo -e "${YELLOW}⚠️  HTTP $HTTP_CODE${NC}"
            return 1
            ;;
    esac
}

# Aguarda servidor estar online
if ! wait_for_server; then
    exit 1
fi

echo ""
echo "🚀 Servidor online! Testando endpoints dos filtros..."
echo ""

# Testa os endpoints principais dos filtros
TESTS_PASSED=0
TOTAL_TESTS=4

echo "📋 TESTANDO ENDPOINTS DOS FILTROS:"
echo ""

if test_endpoint "categories" "Categorias"; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
fi

if test_endpoint "subcategories" "Subcategorias"; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
fi

if test_endpoint "cost-centers" "Centro de Custo"; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
fi

if test_endpoint "bank-accounts/balance" "Bank Accounts Balance"; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
fi

echo ""
echo "📊 RESULTADO:"
echo -e "   ✅ Testes passaram: ${GREEN}$TESTS_PASSED/$TOTAL_TESTS${NC}"

if [ $TESTS_PASSED -eq $TOTAL_TESTS ]; then
    echo -e "${GREEN}🎉 Todos os endpoints funcionando!${NC}"
    echo ""
    echo "📋 PRÓXIMOS PASSOS:"
    echo "1. Acesse: https://trackeone-finance.vercel.app"
    echo "2. Faça login e teste os filtros no Controle Mensal"
    echo "3. Verifique se Categoria/Subcategoria/Centro de Custo carregam"
elif [ $TESTS_PASSED -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Alguns endpoints com problema - verificar logs${NC}"
else
    echo -e "${RED}❌ Todos os endpoints com problema${NC}"
    echo ""
    echo "🔧 DIAGNÓSTICO:"
    echo "1. Verifique logs do Render"
    echo "2. Confirme se as tabelas existem no PostgreSQL"
    echo "3. Teste o endpoint de diagnóstico quando disponível"
fi

echo ""
echo "🔗 Links úteis:"
echo "   • Frontend: https://trackeone-finance.vercel.app"
echo "   • Backend: https://trackeone-backend.onrender.com"
echo "   • API Docs: https://trackeone-backend.onrender.com/api"