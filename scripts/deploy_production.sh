#!/bin/bash

# Script de deploy automatizado para TrackeOne Finance
# Este script prepara e faz o deploy da aplicação para produção

echo "🚀 Iniciando processo de deploy do TrackeOne Finance..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
  echo "❌ Erro: Não encontrado package.json. Execute este script na raiz do projeto."
  exit 1
fi

echo "✅ Verificando estrutura do projeto..."

# Verificar diretórios essenciais
if [ ! -d "client" ] || [ ! -d "server" ]; then
  echo "❌ Erro: Diretórios client ou server não encontrados."
  exit 1
fi

echo "✅ Estrutura do projeto verificada com sucesso."

# Verificar dependências
echo "📦 Verificando dependências..."

# Verificar dependências do servidor
if [ ! -d "server/node_modules" ]; then
  echo "⚠️  Dependências do servidor não encontradas. Instalando..."
  cd server && npm install
  cd ..
fi

# Verificar dependências do cliente
if [ ! -d "client/node_modules" ]; then
  echo "⚠️  Dependências do cliente não encontradas. Instalando..."
  cd client && npm install
  cd ..
fi

echo "✅ Dependências verificadas."

# Executar verificação pré-deploy
echo "🔍 Executando verificação pré-deploy..."
node scripts/deploy_check.js

if [ $? -ne 0 ]; then
  echo "❌ Verificação pré-deploy falhou. Corrija os problemas antes de continuar."
  exit 1
fi

echo "✅ Verificação pré-deploy concluída com sucesso."

# Fazer commit e push das alterações
echo "💾 Salvando alterações no repositório..."

# Adicionar todos os arquivos
git add .

# Verificar se há alterações para commit
if ! git diff --cached --quiet; then
  echo "📝 Há alterações para commit. Criando commit..."
  git commit -m "Preparação para deploy em produção - $(date)"
else
  echo "ℹ️  Nenhuma alteração para commit."
fi

echo "📤 Enviando alterações para o repositório remoto..."
git push origin main

if [ $? -eq 0 ]; then
  echo "✅ Alterações enviadas com sucesso para o repositório."
else
  echo "❌ Erro ao enviar alterações para o repositório."
  exit 1
fi

# Build das aplicações
echo "🏗️  Construindo aplicações para produção..."

echo "🔨 Construindo servidor..."
cd server
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Erro ao construir servidor."
  exit 1
fi
cd ..

echo "🔨 Construindo cliente..."
cd client
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Erro ao construir cliente."
  exit 1
fi
cd ..

echo "✅ Build das aplicações concluído com sucesso."

# Instruções para deploy
echo ""
echo "📋 Instruções para deploy em produção:"
echo ""
echo "1. Deploy do Backend (Render):"
echo "   - Acesse https://dashboard.render.com"
echo "   - Crie um novo Web Service"
echo "   - Conecte o repositório GitHub ngiacherinivillalobos/TrackeOneFinance"
echo "   - Configure:"
echo "     * Name: trackeone-finance-api"
echo "     * Root Directory: server"
echo "     * Build Command: npm install"
echo "     * Start Command: npm start"
echo "   - Adicione as variáveis de ambiente:"
echo "     * NODE_ENV=production"
echo "     * JWT_SECRET=sua_chave_secreta_segura"
echo "     * DATABASE_URL=sua_url_do_banco_postgresql"
echo "     * PORT=3001"
echo ""
echo "2. Deploy do Frontend (Vercel):"
echo "   - Acesse https://vercel.com"
echo "   - Crie um novo projeto"
echo "   - Importe o repositório GitHub ngiacherinivillalobos/TrackeOneFinance"
echo "   - Configure:"
echo "     * Project Name: trackeone-finance"
echo "     * Framework Preset: Vite"
echo "     * Root Directory: client"
echo "   - Adicione a variável de ambiente:"
echo "     * VITE_API_URL=https://trackeone-finance-api.onrender.com/api"
echo ""
echo "3. Banco de Dados (PostgreSQL no Render):"
echo "   - Crie um novo PostgreSQL Database no Render"
echo "   - Anote a DATABASE_URL para usar no backend"
echo ""
echo "✅ Processo de preparação para deploy concluído!"
echo "📄 Consulte o guia completo em DEPLOY_COMPLETO_GUIA.md para instruções detalhadas."