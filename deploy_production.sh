#!/bin/bash

echo "🚀 Iniciando Deploy de Produção"
echo "=============================="

# Verificar se estamos no diretório correto
cd /Users/nataligiacherini/Development/TrackeOneFinance

echo "🔧 Aplicando correções antes do deploy..."
sh deploy_fixes.sh

echo "📦 Construindo o frontend..."
cd client
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Erro ao construir o frontend"
  exit 1
fi

echo "📦 Construindo o backend..."
cd ../server
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Erro ao construir o backend"
  exit 1
fi

echo "✅ Build concluído com sucesso!"

echo "📋 Verificando arquivos de deploy..."
if [ ! -f "dist/server.js" ]; then
  echo "❌ Arquivo dist/server.js não encontrado"
  exit 1
fi

echo "✅ Arquivos de deploy verificados!"

echo ""
echo "📤 Pronto para deploy!"
echo "   Para deploy no Render (backend):"
echo "   - O deploy será automático via GitHub integration"
echo ""
echo "   Para deploy no Vercel (frontend):"
echo "   - O deploy será automático via GitHub integration"
echo ""
echo "📝 Para deploy manual:"
echo "   Vercel: cd client && npx vercel --prod"
echo "   Render: O deploy automático acontece após push para main"

echo ""
echo "✅ Deploy preparado com sucesso!"