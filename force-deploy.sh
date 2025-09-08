#!/bin/bash

# Script para forçar redeploy no Render
# Este script faz um commit vazio para forçar novo deploy

echo "🚀 FORÇANDO REDEPLOY NO RENDER"
echo "================================"

echo "📋 Status atual do repositório:"
git status

echo ""
echo "📤 Fazendo commit vazio para forçar redeploy..."
git commit --allow-empty -m "🔄 Force Render redeploy: trigger new deployment"

echo ""
echo "📤 Enviando para GitHub..."
git push origin main

echo ""
echo "✅ COMMIT VAZIO ENVIADO!"
echo ""
echo "🎯 PRÓXIMOS PASSOS:"
echo "1. Acesse: https://dashboard.render.com"
echo "2. Vá para o serviço: trackeone-finance-api"
echo "3. O deploy deve iniciar automaticamente em ~1-2 minutos"
echo "4. Se não iniciar, clique em 'Manual Deploy' > 'Deploy latest commit'"
echo ""
echo "🔗 URLs para monitorar:"
echo "   - Render Dashboard: https://dashboard.render.com"
echo "   - GitHub Commits: https://github.com/ngiacherinivillalobos/TrackeOneFinance/commits/main"
echo ""
echo "⏱️  Deploy típico leva 5-10 minutos"
