#!/bin/bash

# Monitor do Deploy - TrackeOne Finance
# Monitora o status do deploy no Render e testa os endpoints corrigidos

echo "🚀 Monitorando deploy do TrackeOne Finance..."
echo "📅 $(date)"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="https://trackeone-backend.onrender.com"
MAX_ATTEMPTS=20
ATTEMPT=0

# Função para testar se o servidor está online
test_server() {
    echo -n "Testando servidor... "
    
    # Testa se o servidor responde
    if curl -s -I "$BASE_URL/" 2>/dev/null | grep -q "x-render-routing: no-server"; then
        echo -e "${YELLOW}[DEPLOY EM PROGRESSO]${NC}"
        return 1
    elif curl -s -I "$BASE_URL/" 2>/dev/null | head -1 | grep -q "200\|404"; then
        echo -e "${GREEN}[SERVIDOR ONLINE]${NC}"
        return 0
    else
        echo -e "${RED}[SERVIDOR OFFLINE]${NC}"
        return 1
    fi
}

# Loop de monitoramento
echo "⏳ Aguardando deploy do Render..."
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    echo -n "Tentativa $ATTEMPT/$MAX_ATTEMPTS: "
    
    if test_server; then
        echo -e "${GREEN}✅ Deploy concluído!${NC}"
        echo ""
        
        # Testa os endpoints corrigidos
        echo "🔍 Testando endpoints corrigidos:"
        echo ""
        
        # Teste 1: Health check
        echo -n "1. Health check: "
        if curl -s "$BASE_URL/api/health" 2>/dev/null | grep -q "ok\|status\|healthy" ; then
            echo -e "${GREEN}✅ OK${NC}"
        else
            echo -e "${YELLOW}⚠️  Endpoint não encontrado (normal se não existe)${NC}"
        fi
        
        # Teste 2: Endpoint de diagnóstico
        echo -n "2. Diagnóstico PostgreSQL: "
        DIAG_RESPONSE=$(curl -s "$BASE_URL/api/diagnostic/types" 2>/dev/null)
        if [[ "$DIAG_RESPONSE" =~ "categories" ]] || [[ "$DIAG_RESPONSE" =~ "tables" ]]; then
            echo -e "${GREEN}✅ OK - Endpoint funcionando${NC}"
            echo "   Preview: $(echo "$DIAG_RESPONSE" | cut -c1-80)..."
        elif [[ "$DIAG_RESPONSE" =~ "Not Found" ]]; then
            echo -e "${RED}❌ Endpoint não encontrado${NC}"
        else
            echo -e "${YELLOW}⚠️  Resposta inesperada${NC}"
        fi
        
        # Teste 3: Bank Accounts Balance (principal correção)
        echo -n "3. Bank Accounts Balance: "
        BALANCE_RESPONSE=$(curl -s "$BASE_URL/api/bank-accounts/balance" 2>/dev/null)
        if [[ "$BALANCE_RESPONSE" =~ "Unauthorized" ]]; then
            echo -e "${GREEN}✅ Endpoint respondendo (precisa autenticação)${NC}"
        elif [[ "$BALANCE_RESPONSE" =~ "Not Found" ]]; then
            echo -e "${RED}❌ Endpoint não encontrado${NC}"
        else
            echo -e "${YELLOW}⚠️  Resposta: $(echo "$BALANCE_RESPONSE" | head -c 50)...${NC}"
        fi
        
        echo ""
        echo "📋 PRÓXIMOS PASSOS:"
        echo "1. Acesse https://trackeone-finance.vercel.app"  
        echo "2. Faça login com seu usuário admin"
        echo "3. Teste os filtros na tela principal"
        echo "4. Verifique se os dados carregam sem erro 500"
        echo ""
        echo -e "${GREEN}🎉 Deploy finalizado com sucesso!${NC}"
        exit 0
    fi
    
    echo "Aguardando 15 segundos..."
    sleep 15
done

echo -e "${RED}❌ Timeout: Deploy não foi concluído em tempo hábil${NC}"
echo "Verifique manualmente o status no painel do Render"
exit 1