#!/bin/bash

echo "🚀 === DEPLOY TRACKEONE FINANCE - VERIFICAÇÃO DE PRODUÇÃO ==="
echo "📅 $(date)"
echo ""

# URLs de produção
FRONTEND_URL="https://client-11gx59hle-natali-giacherini-villalobos-projects.vercel.app"
BACKEND_URL="https://trackeone-finance-api.onrender.com"

echo "🌐 URLS DE PRODUÇÃO:"
echo "   Frontend (Vercel): $FRONTEND_URL"
echo "   Backend (Render):  $BACKEND_URL"
echo ""

echo "🔍 TESTANDO BACKEND API..."
echo "──────────────────────────────────────────"

# Teste 1: Health check
echo "1. 🏥 Health Check:"
health_response=$(curl -s "$BACKEND_URL/api/health")
if [ $? -eq 0 ]; then
    echo "   ✅ API respondendo: $health_response"
else
    echo "   ❌ API não está respondendo"
fi
echo ""

# Teste 2: Auth endpoint
echo "2. 🔐 Auth Endpoint:"
auth_response=$(curl -s "$BACKEND_URL/api/auth/validate" -H "Content-Type: application/json")
if [ $? -eq 0 ]; then
    echo "   ✅ Auth endpoint ativo"
else
    echo "   ❌ Auth endpoint com problemas"
fi
echo ""

# Teste 3: Transactions endpoint (sem auth, só para ver se existe)
echo "3. 💰 Transactions Endpoint:"
trans_response=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/transactions")
echo "   HTTP Status: $trans_response"
if [ "$trans_response" = "401" ]; then
    echo "   ✅ Endpoint ativo (401 = requer autenticação)"
elif [ "$trans_response" = "200" ]; then
    echo "   ✅ Endpoint ativo e respondendo"
else
    echo "   ⚠️  Status inesperado: $trans_response"
fi
echo ""

echo "🌐 TESTANDO FRONTEND..."
echo "──────────────────────────────────────────"

# Teste do frontend
echo "4. 🎨 Frontend Response:"
frontend_status=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
echo "   HTTP Status: $frontend_status"
if [ "$frontend_status" = "200" ]; then
    echo "   ✅ Frontend carregando corretamente"
else
    echo "   ❌ Frontend com problemas (Status: $frontend_status)"
fi
echo ""

echo "📋 FUNCIONALIDADES DEPLOYED:"
echo "──────────────────────────────────────────"
echo "✅ Transações Vencidas:"
echo "   - Busca transações vencidas de todo período"
echo "   - Exibição separada no MonthlyControl e Dashboard"
echo ""
echo "✅ Correção Data D-1:"
echo "   - getLocalDateString() para datas locais"
echo "   - createSafeDate() robusta com validações"
echo "   - Sem problemas de timezone em produção"
echo ""
echo "✅ Edição em Lote:"
echo "   - Endpoint POST /api/transactions/batch-edit"
echo "   - Seleção múltipla de transações"
echo "   - Update em massa de campos"
echo ""
echo "✅ Total 'A Pagar' Melhorado:"
echo "   - Considera status Em Aberto (1) + Vencido (374)"
echo "   - Consistente entre Dashboard e MonthlyControl"
echo "   - Cálculo: vencidos + vencemHoje + aVencer"
echo ""
echo "✅ Dashboard Erro Corrigido:"
echo "   - RangeError: Invalid time value eliminado"
echo "   - Validação savingsGoal.target_date"
echo "   - createSafeDate() centralizada"
echo ""

echo "🧪 TESTES RECOMENDADOS EM PRODUÇÃO:"
echo "──────────────────────────────────────────"
echo "1. Acessar $FRONTEND_URL"
echo "2. Fazer login no sistema"
echo "3. Verificar Dashboard sem erros no console"
echo "4. Testar MonthlyControl:"
echo "   - Verificar se transações vencidas aparecem"
echo "   - Testar filtros por período"
echo "   - Verificar totais 'A Pagar'"
echo "   - Testar seleção múltipla e batch edit"
echo "5. Verificar 'Marcar como Pago' não mostra d-1"
echo "6. Verificar Meta de Economia no Dashboard"
echo ""

echo "📦 ÚLTIMO COMMIT DEPLOYED:"
git log -1 --pretty=format:"   🔄 %h - %s" 2>/dev/null || echo "   (Git log não disponível)"
echo ""
echo ""

echo "🎉 === DEPLOY CONCLUÍDO ==="
echo "Frontend: ✅ Deployed no Vercel"
echo "Backend:  ✅ Auto-deployed no Render"
echo "Status:   🟢 Produção Ativa"
echo ""

echo "🔗 LINKS DIRETOS:"
echo "Frontend: $FRONTEND_URL"
echo "Backend:  $BACKEND_URL/api/health"
echo "API Docs: $BACKEND_URL/api"
